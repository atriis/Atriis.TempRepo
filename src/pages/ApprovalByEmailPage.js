/**
 * Page Object for the approval-by-email screen (approval-by-email.vue).
 * Contains only UI-level interactions.
 *
 * This is the anonymous `/tripApproval/:approvalType?request=<token>` route an approver lands on
 * from the Approve / Decline links in the approval request email. It replaces the whole app shell,
 * so it is always driven on its own page, never on the traveller's trip page.
 */

const SELECTORS = {
  TITLE: ".approval-by-email h4.approval-title",
  // Material-symbol NAME rendered as text: check_circle (approved), flight_takeoff (approve with
  // confirmation), cancel (declined).
  ICON: ".approval-by-email .approval-icon",
  // Only rendered for approvalType=approvewithconfirmation ("Enable approval confirmation on pop-up").
  CONFIRMATION_CHECKBOX: ".approval-by-email .checkbox-container .el-checkbox",
  CONFIRMATION_CHECKBOX_LABEL: ".approval-by-email .checkbox-container .el-checkbox__label",
  CONFIRMATION_CHECKBOX_INPUT: ".approval-by-email .checkbox-container .el-checkbox input[type='checkbox']",
  APPROVE_BUTTON: ".approval-by-email .checkbox-container .approval-btn",
};

class ApprovalByEmailPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Opens an approval link from the email on this page.
   *
   * @param {string} href - The link exactly as it appears in the email
   */
  async open(href) {
    await this.page.goto(href, { waitUntil: "domcontentloaded" });
  }

  /**
   * Waits for the approval screen's title, i.e. for the route to render past its loading state.
   *
   * @param {number} [timeout=30000]
   */
  async waitForTitleVisible(timeout = 30000) {
    await this.page.locator(SELECTORS.TITLE).waitFor({ state: "visible", timeout });
  }

  /** @returns {Promise<string>} The screen title, whitespace-normalised */
  async getTitleText() {
    return ((await this.page.locator(SELECTORS.TITLE).textContent()) || "").replace(/\s+/g, " ").trim();
  }

  /** @returns {Promise<string>} The material-symbol name of the status icon */
  async getIconName() {
    return ((await this.page.locator(SELECTORS.ICON).textContent()) || "").trim();
  }

  /**
   * Waits for the confirmation checkbox (approve-with-confirmation only).
   *
   * @param {number} [timeout=15000]
   */
  async waitForConfirmationCheckboxVisible(timeout = 15000) {
    await this.page.locator(SELECTORS.CONFIRMATION_CHECKBOX).waitFor({ state: "visible", timeout });
  }

  /** @returns {Promise<string>} The confirmation checkbox label, whitespace-normalised */
  async getConfirmationCheckboxLabelText() {
    const label = await this.page.locator(SELECTORS.CONFIRMATION_CHECKBOX_LABEL).textContent();
    return (label || "").replace(/\s+/g, " ").trim();
  }

  /** @returns {Promise<boolean>} Whether the confirmation checkbox is ticked */
  async isConfirmationCheckboxChecked() {
    return this.page.locator(SELECTORS.CONFIRMATION_CHECKBOX_INPUT).isChecked();
  }

  /** @returns {import('playwright').Locator} The Approve button under the checkbox */
  getApproveButton() {
    return this.page.locator(SELECTORS.APPROVE_BUTTON);
  }
}

module.exports = { ApprovalByEmailPage, SELECTORS };
