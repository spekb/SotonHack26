const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function test() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--autoplay-policy=no-user-gesture-required',
      '--use-fake-ui-for-media-stream',
      '--allow-file-access-from-files'
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
