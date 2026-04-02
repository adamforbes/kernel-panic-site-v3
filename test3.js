const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: "new"});
  const page = await browser.newPage();
  await page.setViewport({width: 429, height: 715});
  await page.goto('http://localhost:3000/#cards', {waitUntil: 'networkidle0'});
  
  // click next until cards is visible
  for(let i=0; i<4; i++) {
     try {
       await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const nextBtn = btns.find(b => b.innerText.includes('N') && b.innerText.includes('ext'));
          if (nextBtn) nextBtn.click();
       });
       await page.waitForTimeout(500);
     } catch(e) {}
  }
  
  const html = await page.evaluate(() => {
    const carousel = document.querySelector('[class*="slideCarousel"]');
    if (!carousel) return 'no carousel';
    const items = carousel.querySelectorAll('[class*="carouselItemMobile"]');
    let res = {
      scrollWidth: carousel.scrollWidth,
      clientWidth: carousel.clientWidth,
      itemCount: items.length,
      items: []
    };
    items.forEach((i, idx) => {
      res.items.push({
        idx,
        width: i.clientWidth,
        offsetLeft: i.offsetLeft,
        text: i.innerText.slice(0, 20).replace(/\n/g, ' ')
      });
    });
    return res;
  });
  console.log(JSON.stringify(html, null, 2));
  await browser.close();
})();
