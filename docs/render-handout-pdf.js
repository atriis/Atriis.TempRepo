const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const htmlPath = 'file://' + path.resolve(__dirname, 'how-to-use-git.html');
  const outPath = path.resolve(__dirname, 'How-To-Use-Git.pdf');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(htmlPath, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await browser.close();
  console.log('PDF written to: ' + outPath);
})();
