/**
 * Approval By Email DSL
 *
 * The anonymous approval screen an approver lands on from the Approve / Decline links in the
 * approval request email (approval-by-email.vue, route `/tripApproval/:approvalType`).
 *
 * Division of labour with the Email DSL:
 * - Email owns the delivered mail: finding the approval request and picking its accept link.
 * - ApprovalByEmail owns the screen that link opens.
 */

const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { ApprovalByEmailPage } = require("@pages/ApprovalByEmailPage");
const logger = require("@utils/logger").child("ApprovalByEmail-DSL");

const normalize = (value) => (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();

const ApprovalByEmail = {
  /**
   * Opens an approval link the way the approver does from their mail client: in a NEW page of the
   * same browser context. The route is anonymous and replaces the whole app, so it must not
   * navigate the traveller's trip page.
   *
   * With approval confirmation enabled an accept link only opens the confirmation screen; with it
   * disabled, opening the link IS the approval (approval-by-email.ts approves on load).
   *
   * @param {import('@playwright/test').Page} page - Any page of the scenario's context
   * @param {string} href - The link exactly as it appears in the email
   * @returns {Promise<import('@playwright/test').Page>} The page showing the approval screen
   */
  async openApprovalLink(page, href) {
    if (!page) throw new Error("[ApprovalByEmail.openApprovalLink] page is required");
    if (typeof href !== "string" || !/\/tripApproval\//i.test(href)) {
      throw new Error(
        `[ApprovalByEmail.openApprovalLink] "href" must be a /tripApproval/ link from the approval email, got: ${href}`
      );
    }

    logger.info("[ApprovalByEmail.openApprovalLink] Opening the approval link in a new page");
    const approvalPage = await page.context().newPage();
    await getPageObject(approvalPage, ApprovalByEmailPage).open(href);
    return approvalPage;
  },

  /**
   * Verifies the approval screen asks the approver to confirm with a checkbox, and that the
   * checkbox starts unticked with an Approve button under it.
   *
   * @param {import('@playwright/test').Page} approvalPage - From openApprovalLink
   * @param {string} expectedLabel - The checkbox label
   * @returns {Promise<{title: string, label: string}>}
   */
  async verifyConfirmationCheckboxDisplayed(approvalPage, expectedLabel) {
    if (!approvalPage) {
      throw new Error(
        "[ApprovalByEmail.verifyConfirmationCheckboxDisplayed] No approval page is open — open the " +
          "accept link from the approval request email first."
      );
    }
    if (typeof expectedLabel !== "string" || !expectedLabel.trim()) {
      throw new Error(
        `[ApprovalByEmail.verifyConfirmationCheckboxDisplayed] "expectedLabel" must be a non-empty string, got: ${expectedLabel}`
      );
    }

    const approvalByEmailPage = getPageObject(approvalPage, ApprovalByEmailPage);
    await approvalByEmailPage.waitForTitleVisible();
    const title = await approvalByEmailPage.getTitleText();

    try {
      await approvalByEmailPage.waitForConfirmationCheckboxVisible();
    } catch {
      // Thrown rather than asserted through expect(): what the screen showed instead (an instant
      // "Trip approved!" means the accept link had no confirmation step) is the diagnostic.
      throw new Error(
        "[ApprovalByEmail.verifyConfirmationCheckboxDisplayed] The approval screen shows no " +
          `confirmation checkbox. Title: "${title}", icon: "${await approvalByEmailPage.getIconName()}"`
      );
    }

    const label = await approvalByEmailPage.getConfirmationCheckboxLabelText();
    if (normalize(label) !== normalize(expectedLabel)) {
      throw new Error(
        `[ApprovalByEmail.verifyConfirmationCheckboxDisplayed] The confirmation checkbox reads "${label}", ` +
          `expected "${expectedLabel}".`
      );
    }
    if (await approvalByEmailPage.isConfirmationCheckboxChecked()) {
      throw new Error(
        "[ApprovalByEmail.verifyConfirmationCheckboxDisplayed] The confirmation checkbox is already " +
          "ticked; the approver must tick it themselves."
      );
    }
    await expect(approvalByEmailPage.getApproveButton()).toBeVisible();

    logger.info("[ApprovalByEmail.verifyConfirmationCheckboxDisplayed] Confirmation checkbox displayed", {
      title,
      label,
    });
    return { title, label };
  },
};

module.exports = ApprovalByEmail;
