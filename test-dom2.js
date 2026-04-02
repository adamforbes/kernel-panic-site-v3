const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: "new"});
  const page = await browser.newPage();
  await page.setViewport({width: 500, height: 750});
  await page.goto('http://localhost:3000/', {waitUntil: 'networkidle0'});
  
  // keep clicking button until slideCarousel appears
  let found = false;
  for (let i = 0; i < 10; i++) {
    const hasCarousel = await page.$('.page_slideCarousel__G7oG2, [class*="slideCarousel"]');
    if (hasCarousel) { found = true; break; }
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const next = btns.find(b => b.innerText.includes('N') && b.innerText.includes('ext') || b.innerText.includes('→'));
      if (next) next.click();
    });
    await new Promise(r => setTimeout(r, 500));
  }
  
  if (!found) {
    console.log("Still no carousel");
    await browser.close();
    return;
  }
  
  const metrics = await page.evaluate(() => {
    const carousel = document.querySelector('[class*="slideCarousel"]');
    const children = Array.from(carousel.children);
    return children.map(c => {
      const computed = window.getComputedStyle(c);
      return {
        tag: c.tagName,
        className: c.className,
        display: computed.display,
        width: c.offsetWidth,
        clientWidth: c.clientWidth,
        flex: computed.flex,
        content: c.innerText.substring(0, 20).replace(/\n/g, ' ')
      };
    });
  });
  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
})();
