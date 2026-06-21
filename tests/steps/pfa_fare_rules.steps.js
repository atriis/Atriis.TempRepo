require('module-alias/register');
const { When, Then } = require('@cucumber/cucumber');
const fs = require('fs');
const path = require('path');
const logger = require('@utils/logger').child('PfaFareRules');

// Steps scoped to: pfa_fare_rules_change_cancel_info.feature
// These steps are intentionally self-contained and not added to the shared step catalog.

When('I click fare rules for the first PFA fare', async function () {
  const cards = this.page
    .locator('.leg-pricing-option')
    .filter({ has: this.page.locator('.agreement-icon') });

  await cards.first().waitFor({ state: 'visible', timeout: 30000 });
  const count = await cards.count();

  for (let i = 0; i < count; i++) {
    const icon = cards.nth(i).locator('.agreement-icon').first();
    await icon.hover();
    const tooltip = this.page.locator('.el-popper:visible').filter({ hasText: 'PFA' });
    try {
      await tooltip.waitFor({ state: 'visible', timeout: 2000 });
      await cards.nth(i).getByText('Fare rules').click();
      return;
    } catch {
      // not PFA — try next card
    }
  }

  throw new Error('No pricing option with a PFA agreement label was found after hovering all agreement icons.');
});

Then('change and cancel info is displayed', async function () {
  const fareRulesDrawer = this.page.locator('.fare-rules');
  await fareRulesDrawer.waitFor({ state: 'visible', timeout: 15000 });
  await fareRulesDrawer.locator('.main-headline').first().waitFor({ state: 'visible', timeout: 15000 });

  const fullText = await fareRulesDrawer.innerText();

  // Check for the structured PFA-specific section titles — these are distinct from generic
  // GDS raw fare rules text (which mentions "change/cancel" but not as structured section headers)
  const structuredSections = ['Change Before Departure', 'Cancel Before Departure'];
  const missing = structuredSections.filter(s => !fullText.includes(s));

  if (missing.length > 0) {
    throw new Error(
      `PFA fare rules are missing structured change/cancel sections: [${missing.join(', ')}]\n` +
      `Full content:\n${fullText.substring(0, 500)}`
    );
  }

  logger.info('PFA fare rules structured change/cancel sections verified', { found: structuredSections });

  // Screenshot of fare rules drawer as proof
  const screenshotDir = path.join('test-results', 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
  const screenshotPath = path.join(screenshotDir, `pfa_fare_rules_proof_${Date.now()}.png`);
  const buffer = await fareRulesDrawer.screenshot();
  fs.writeFileSync(screenshotPath, buffer);
  this.attach(buffer, 'image/png');
  logger.info('Fare rules screenshot saved', { path: screenshotPath });
});
