require('module-alias/register');

const { When, Then, setDefaultTimeout } = require('@cucumber/cucumber');
const { Shell } = require('@dsl');
const { expect } = require('@playwright/test');
const logger = require('@utils/logger').child('Shell');

setDefaultTimeout(120000);

When('I hover over the quick link product card on the homepage', async function () {
  logger.info('Hovering over quick link product card on homepage');
  await Shell.hoverQuickLinkProductCard(this.page);
});

Then('the default product picture should be displayed on the quick link card', async function () {
  logger.info('Verifying default picture is displayed on quick link card');
  const src = await Shell.getQuickLinkCardImageSrc(this.page);
  // Vite inlines the no-qlink.svg as a data URI; an external configured image would be an http(s) URL
  expect(
    src,
    `Quick link card should display the default inline SVG (data:image/svg+xml) when no external image is configured. Got: "${src}"`
  ).toMatch(/^data:image\/svg\+xml/);
});
