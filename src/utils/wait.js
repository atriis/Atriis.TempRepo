// utils/wait.js
async function waitForText(page, selector, expectedText, timeout = 30000) {
  await page.waitForFunction(
    ([selector, expectedText]) => {
      const element = document.querySelector(selector);
      if (!element) return false;

      const text = element.textContent
        .replace(/[\r\n]+/g, '')
        .trim();

      return text === expectedText.trim();
    },
    [selector, expectedText],
    { timeout }
  );
}

// wait helper with seconds
async function wait(page, seconds) {
  await page.waitForTimeout(seconds * 1000);
}

module.exports = {
  waitForText,
  wait,
};
