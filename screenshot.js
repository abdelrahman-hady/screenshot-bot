const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Add auto-scroll function
const autoScroll = async (page) => {
  try {
    await page.evaluate(async () => {
      try {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const scrollStep = 500;
          const scrollInterval = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, scrollStep);
            totalHeight += scrollStep;
            if(totalHeight >= scrollHeight) {
              clearInterval(scrollInterval);
              resolve();
            }
          }, 700);
        });
      } catch (err) {
        console.error('page.evaluate Error: ', err.message);
      }
    });
  } catch (err) {
    console.error('autoScroll Error: ', err.message);
  }
};

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",  // <-- Add this option
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox' // Recommended for CI environments
      ]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1500, height: 1080 });

    // Read URLs from urls.txt
    const urls = fs.readFileSync('urls.txt', 'utf-8').split('\n').filter(Boolean);

    // Ensure screenshots folder exists
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir);
    }

    for (let url of urls) {
      console.log(`Capturing: ${url}`);

      // Set Amasty cookie for current domain
      // This is needed to remove the cookie settings modal
      const urlObj = new URL(url);
      await page.setCookie({
        name: 'amcookie_allowed',
        value: '0',
        domain: urlObj.hostname
      });

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 120000
      });

      await autoScroll(page);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Stabilization period

      // Set Amasty cookie acceptance timestamp to localStorage
      // This is needed to remove the cookie settings modal
      await page.evaluate(() => {
        localStorage.setItem('am-last-cookie-acceptance', '1733216227');
      });

      // Safe filename generation
      const filename = url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_');
      const filepath = path.join(screenshotDir, `${filename}.png`);

      await page.screenshot({ path: filepath, fullPage: true });
    }

    await browser.close();
  } catch (err) {
    console.error(`Error capturing ${url}:`, err.message);
  }
})();
