const puppeteer = require('puppeteer');

(async () => {
  try {
      const browser = await puppeteer.launch({headless: "new"});
      const page = await browser.newPage();
      await page.setViewport({width: 500, height: 715});
      await page.goto('http://localhost:3000/#cards', {waitUntil: 'networkidle0'});
      
      // wait for slideCarousel
      await page.waitForSelector('[class*="slideCarousel"]', {timeout: 5000});

      const metrics = await page.evaluate(() => {
        const carousel = document.querySelector('[class*="slideCarousel"]');
        if (!carousel) return 'no carousel';
        
        const items = carousel.querySelectorAll('[class*="carouselItemMobile"]');
        const computed = window.getComputedStyle(carousel);
        
        return {
          carouselWidth: carousel.clientWidth,
          carouselScrollWidth: carousel.scrollWidth,
          carouselPadding: computed.padding,
          carouselJustify: computed.justifyContent,
          items: Array.from(items).map(item => ({
             text: item.innerText.split('\n')[0],
             width: item.clientWidth,
             offsetLeft: item.offsetLeft,
             display: window.getComputedStyle(item).display
          }))
        };
      });
      console.log("DOM_METRICS=" + JSON.stringify(metrics, null, 2));
      await browser.close();
  } catch (e) {
      console.log("ERROR", e);
  }
})();
