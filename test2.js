const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: "new"});
  const page = await browser.newPage();
  await page.setViewport({width: 429, height: 715});
  await page.goto('http://localhost:3000/#cards', {waitUntil: 'networkidle0'});
  
  // Try to click Next button 4 times just in case hash jump fails
  for(let i=0; i<4; i++) {
     try {
       await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const nextBtn = btns.find(b => b.innerText.includes('→') || b.innerText.includes('Next'));
          if (nextBtn) nextBtn.click();
       });
       await page.waitForTimeout(300);
     } catch(e) {}
  }
  
  await page.waitForSelector('[class*="slideCarousel"]', {timeout: 3000}).catch(()=>console.log("Still no carousel"));

  const html = await page.evaluate(() => {
    const carousel = document.querySelector('[class*="slideCarousel"]');
    if (!carousel) return 'no carousel';
    const items = carousel.querySelectorAll('[class*="carouselItemMobile"]');
    return {
      scrollWidth: carousel.scrollWidth,
      clientWidth: carousel.clientWidth,
      itemCount: items.length,
      items: Array.from(items).map(i => ({
        width: i.clientWidth,
        display: window.getComputedStyle(i).display,
        text: i.innerText.slice(0, 20).replace(/\n/g, ' ')
      }))
    };
  });
  console.log(JSON.stringify(html, null, 2));
  await browser.close();
})();
