const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000/learn.html', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'artifacts/screenshot.png', fullPage: true });
  await browser.close();
})();
