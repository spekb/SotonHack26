import puppeteer, { Browser, Page } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

// Define the global store structure
interface GlobalStore {
  browser: Browser | null;
  pages: Record<string, Page>;
}

// Ensure globalThis has our store
const globalStore = (globalThis as unknown as { __puppeteerStore: GlobalStore }).__puppeteerStore || {
  browser: null,
  pages: {}
};
(globalThis as unknown as { __puppeteerStore: GlobalStore }).__puppeteerStore = globalStore;

/**
 * Initializes the Puppeteer browser if it isn't already running.
 */
async function getBrowser(): Promise<Browser> {
  if (!globalStore.browser) {
    globalStore.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't works in Windows
        '--disable-gpu',
        '--autoplay-policy=no-user-gesture-required',
        '--use-fake-ui-for-media-stream',
        '--allow-file-access-from-files'
      ]
    });
  }
  return globalStore.browser;
}

/**
 * Starts recording a specific stream from VDO.Ninja
 */
export async function startRecording(streamId: string): Promise<boolean> {
  try {
    if (globalStore.pages[streamId]) {
      console.log(`[Recorder] Recording already in progress for stream ${streamId}`);
      return true; // Already recording
    }

    const browser = await getBrowser();
    const page = await browser.newPage();
    
    // Store the page reference globally
    globalStore.pages[streamId] = page;

    // Navigate to VDO.Ninja view URL for this stream
    // &autoplay=1 is crucial, &clean hides all UI, &novideo saves bandwidth
    const viewUrl = `https://vdo.ninja/?view=${streamId}&clean=1&autoplay=1&novideo=1`;
    console.log(`[Recorder] Opening page: ${viewUrl}`);
    await page.goto(viewUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for the video element to be created by vdo.ninja and have a stream
    await page.waitForSelector('video', { timeout: 30000 });

    // Inject MediaRecorder logic into the Chromium page context
    await page.evaluate(() => {
      return new Promise<void>((resolve, reject) => {
        try {
          // Find the video element VDO.Ninja created
          const videoElement = document.querySelector('video') as HTMLVideoElement;
          if (!videoElement) {
            return reject('No video element found');
          }

          let stream = videoElement.srcObject as MediaStream;

          // If the stream isn't there yet, wait for it
          if (!stream) {
            console.log('Stream not attached yet, waiting for loadedmetadata...');
            videoElement.addEventListener('loadedmetadata', () => {
               stream = videoElement.srcObject as MediaStream;
               startMediaRecorder(stream);
            }, { once: true });
          } else {
             startMediaRecorder(stream);
          }

          function startMediaRecorder(mediaStream: MediaStream) {
            console.log('Got MediaStream, starting recorder');
            
            // Extract only audio tracks for audio-only recording
            const audioStream = new MediaStream(mediaStream.getAudioTracks());
            
            const chunks: Blob[] = [];
            // Try higher quality codec first, fallback to standard webm
            const options = MediaRecorder.isTypeSupported('audio/webm; codecs=opus') 
               ? { mimeType: 'audio/webm; codecs=opus' } 
               : { mimeType: 'audio/webm' };
               
            const recorder = new MediaRecorder(audioStream, options);
            
            // Attach recorder to window so we can access it later to stop it
            (window as any)._mediaRecorder = recorder;
            (window as any)._recordedChunks = chunks;
            
            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                chunks.push(e.data);
              }
            };

            // When recording stops, we convert the blob to base64 so Puppeteer can extract it
            recorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = () => {
                // We dispatch a custom event that Puppeteer will listen for
                const event = new CustomEvent('recordingReady', { detail: reader.result });
                document.dispatchEvent(event);
              };
            };
            
            recorder.start(1000); // collect 1s chunks
            resolve();
          }

        } catch (e: any) {
          reject(e.toString());
        }
      });
    });

    console.log(`[Recorder] Started recording stream ${streamId}`);
    return true;

  } catch (error) {
    console.error(`[Recorder] Error starting recording for ${streamId}:`, error);
    if (globalStore.pages[streamId]) {
      await globalStore.pages[streamId].close().catch(() => {});
      delete globalStore.pages[streamId];
    }
    return false;
  }
}

/**
 * Stops the recording, extracts the Base64 video, and saves it to disk
 */
export async function stopRecording(streamId: string): Promise<string | null> {
  const page = globalStore.pages[streamId];
  if (!page) {
    console.log(`[Recorder] No active recording found for stream ${streamId}`);
    return null;
  }

  try {
    console.log(`[Recorder] Stopping recording for stream ${streamId}`);
    
    // Set up a promise to listen for the recordingReady event triggered by FileReader
    const getBase64Promise = page.evaluate(() => {
      return new Promise<string>((resolve) => {
        document.addEventListener('recordingReady', (e: any) => {
          resolve(e.detail);
        }, { once: true });
        
        // Trigger the stop on the recorder
        const recorder = (window as any)._mediaRecorder;
        if (recorder && recorder.state !== 'inactive') {
           recorder.stop();
        } else {
           resolve('ERROR: Recorder not active');
        }
      });
    });

    // Wait for the Base64 data (with a timeout)
    // 30s timeout is generous, usually it takes <1s
    const base64Data = await Promise.race([
      getBase64Promise,
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Timeout extracting video data')), 30000))
    ]);

    if (!base64Data || typeof base64Data !== 'string' || base64Data.startsWith('ERROR')) {
       throw new Error(`Failed to extract base64 data: ${base64Data}`);
    }

    // Prepare the raw binary data
    // Format is "data:video/webm;base64,xxxxxxxxxx..."
    const base64Content = base64Data.split(',')[1];
    const buffer = Buffer.from(base64Content, 'base64');

    // Make sure recordings directory exists
    const repDir = path.join(process.cwd(), 'recordings');
    if (!fs.existsSync(repDir)) {
      fs.mkdirSync(repDir, { recursive: true });
    }

    const filename = `${streamId}-${Date.now()}.webm`;
    const filepath = path.join(repDir, filename);

    // Save to disk
    fs.writeFileSync(filepath, buffer);
    console.log(`[Recorder] Saved recording to ${filepath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

    return filename; // Return just the filename for reference

  } catch (error) {
    console.error(`[Recorder] Error stopping recording for ${streamId}:`, error);
    return null;
  } finally {
    // Always clean up the page
    if (page) {
       await page.close().catch(() => {});
       delete globalStore.pages[streamId];
    }
  }
}
