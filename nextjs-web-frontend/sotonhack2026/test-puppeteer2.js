const puppeteer = require('puppeteer-core');
const chromium = require('chromium');

async function test() {
  console.log("Launching browser with chromium module:", chromium.path);
  const browser = await puppeteer.launch({
    executablePath: chromium.path,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });
  console.log("Browser launched.");
  const page = await browser.newPage();
  console.log("Page created.");
  await page.goto('https://vdo.ninja/?view=test_stream_123', { waitUntil: 'networkidle2' });
  console.log("Navigated to page.");
  await browser.close();
  console.log("Browser closed.");
}

test().catch(console.error);
