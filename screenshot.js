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
    console.log('Starging...');

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

    let popupsHandled = false;

    for (let url of urls) {
      // Parse the URL to get the domain for cookies
      const urlObj = new URL(url);
      
      // Set the required cookies for the domain
      await page.setCookie(
        {
          name: 'customer-type-popup-set',
          value: '1',
          domain: urlObj.hostname
        },
        {
          name: 'store-switcher-first-load',
          value: 'true',
          domain: urlObj.hostname
        }
      );

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 120000
      });

      await autoScroll(page);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Stabilization period

      // Check for Usercentrics cookie consent dialog and click accept button
      try {
        if (!popupsHandled) {
          // Step 1: Handle Usercentrics consent
          const consentHandled = await page.evaluate(() => {
            const usercentricsElement = document.querySelector('#usercentrics-cmp-ui');
            if (usercentricsElement) {
              if (usercentricsElement.shadowRoot) {
                const acceptButton = usercentricsElement.shadowRoot.querySelector('button#accept.uc-accept-button');
                if (acceptButton) {
                  acceptButton.click();
                  return 'Usercentrics accept button clicked';
                }
              }
            }
            return false;
          });

          if (consentHandled) {
            console.log(`Cookie consent handled: ${consentHandled}`);
            // Wait for any animations to complete
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            console.log('No cookie consent dialog detected or could not be handled');
          }

          // Mark popups as handled so we don't repeat for other URLs
          popupsHandled = true;
        }
      } catch (err) {
        console.error('Error handling popups:', err.message);
      }

      // Safe filename generation
      const filename = url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_');
      const filepath = path.join(screenshotDir, `${filename}.png`);

      console.log(`Capturing: ${url}`);

      await page.screenshot({ path: filepath, fullPage: true });
    }

    await browser.close();
  } catch (err) {
    console.error(`Error capturing:`, err.message);
  }
})();
