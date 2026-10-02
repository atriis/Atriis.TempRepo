/**
 * Approval By Email Steps
 *
 * The anonymous approval screen opened from the approval request email. The step that opens it
 * ("I click accept in the approval request email") lives in email.steps.js, beside the step that
 * reads the mail, and stores the opened page on `this.approvalByEmailPage`.
 */

const { Then } = require("@cucumber/cucumber");
const ApprovalByEmail = require("@dsl/ApprovalByEmail");
const logger = require("@utils/logger").child("ApprovalByEmail-Steps");

Then("the approval confirmation checkbox {string} should be displayed", async function (label) {
  logger.info("Verifying the approval confirmation checkbox is displayed", { label });
  await ApprovalByEmail.verifyConfirmationCheckboxDisplayed(this.approvalByEmailPage, label);
});
