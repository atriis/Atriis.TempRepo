require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Chat } = require("@dsl");
const logger = require("@utils/logger").child("Chat");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I open the chat", async function () {
  logger.info("Opening the chat panel");
  await Chat.openChat(this.page);
});

When("I start a new chat conversation", async function () {
  logger.info("Starting a new chat conversation");
  await Chat.startNewChatConversation(this.page);
});

When("I add an agent to the chat", async function () {
  logger.info("Adding an agent to the chat");
  await Chat.addAgentToChat(this.page);
});

When("I type {string} in the chat message field", async function (message) {
  logger.info(`Typing message in chat: "${message}"`);
  await Chat.typeMessageInChat(this.page, message);
});

When("I send the chat message", async function () {
  logger.info("Sending the chat message");
  await Chat.sendChatMessage(this.page);
});

// ===== THEN STEPS =====

Then("the chat conversation should display the message {string}", async function (message) {
  logger.info(`Verifying chat conversation displays: "${message}"`);
  await Chat.verifyChatMessageDisplayed(this.page, message);
});
