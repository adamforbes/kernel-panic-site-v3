const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 800 });
  await page.goto('http://localhost:3001');
  await page.waitForSelector('.titleBar');
  
  // click next, next
  await page.evaluate(() => {
    const nextBtn = document.querySelectorAll('button')[1]; // assuming 2nd button is next
    nextBtn.click(); // to text
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const nextBtn = document.querySelectorAll('button')[1];
    nextBtn.click(); // to splitL
  });
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'splitL.png' });
  await browser.close();
})();
