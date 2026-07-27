require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { GenesysChat } = require("@dsl");
const logger = require("@utils/logger").child("GenesysChat");

setDefaultTimeout(120000);

// Steps for the Genesys "chat with agent" floating widget (app-genesys).
// The trip conversation / consultant chat is a different component — see chat.steps.js.

// ===== WHEN STEPS =====

When("I open the agent chat", async function () {
  logger.info("Opening the agent chat widget");
  await GenesysChat.openAgentChat(this.page);
});

When("I type {string} in the agent chat message field", async function (message) {
  logger.info(`Typing message in the agent chat: "${message}"`);
  await GenesysChat.typeAgentChatMessage(this.page, message);
});

When("I send the agent chat message", async function () {
  logger.info("Sending the agent chat message");
  await GenesysChat.sendAgentChatMessage(this.page);
});

When("I close the agent chat", async function () {
  logger.info("Closing the agent chat widget");
  await GenesysChat.closeAgentChat(this.page);
});

When("I confirm ending the agent chat", async function () {
  logger.info("Confirming the end of the agent chat conversation");
  await GenesysChat.confirmEndAgentChat(this.page);
});

// ===== THEN STEPS =====

Then("the agent chat should display the message {string}", async function (message) {
  logger.info(`Verifying the agent chat displays the message: "${message}"`);
  await GenesysChat.verifyAgentChatMessageDisplayed(this.page, message);
});

Then("the agent chat should be closed", async function () {
  logger.info("Verifying the agent chat widget is closed");
  await GenesysChat.verifyAgentChatClosed(this.page);
});
