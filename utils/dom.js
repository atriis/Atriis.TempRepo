// utils/dom.js

async function getText(page, selector) {
  const locator = page.locator(selector).first();

  await locator.waitFor({ state: 'visible' });

  const text = await locator.textContent();
  return text;
}

async function scrollToElement(page, selector) {
  const el = page.locator(selector).first();

  // First wait for element to exist in DOM
  await el.waitFor({ state: 'attached' });

  // Then wait for it to be visible onscreen
  await el.waitFor({ state: 'visible' });

  await el.evaluate((node) => {
    node.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: 'auto'
    });
  });
}


module.exports = {
  getText,
  scrollToElement,
};
