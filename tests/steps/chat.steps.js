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

When("I select the traveler {string} in the conversation form", async function (traveler) {
  logger.info(`Selecting the traveler "${traveler}" in the conversation form`);
  await Chat.selectTravelerInConversation(this.page, traveler);
});

When("I navigate back from the chat to the trip", async function () {
  logger.info("Navigating back from the chat to the trip");
  await Chat.navigateBackFromChat(this.page);
});

When("I type {string} in the chat message field", async function (message) {
  logger.info(`Typing message in chat: "${message}"`);
  await Chat.typeMessageInChat(this.page, message);
});

When("I send the chat message", async function () {
  logger.info("Sending the chat message");
  await Chat.sendChatMessage(this.page);
});

When("I search for consultant {string}", async function (name) {
  logger.info(`Searching for consultant: "${name}"`);
  await Chat.searchConsultant(this.page, name);
});

When("I select the first consultant from the search dropdown", async function () {
  logger.info("Selecting the first consultant from the search dropdown");
  await Chat.selectConsultantFromDropdown(this.page);
});

// ===== THEN STEPS =====

Then("the chat conversation should display the message {string}", async function (message) {
  logger.info(`Verifying chat conversation displays: "${message}"`);
  await Chat.verifyChatMessageDisplayed(this.page, message);
});

Then("the consultant {string} should appear in the search dropdown", async function (name) {
  logger.info(`Verifying consultant "${name}" appears in the search dropdown`);
  await Chat.verifyConsultantInDropdown(this.page, name);
});

Then("the consultant {string} should be in the recipients list", async function (name) {
  logger.info(`Verifying consultant "${name}" is in the recipients list`);
  await Chat.verifyConsultantInRecipients(this.page, name);
});

Then("the associated consultant should be {string}", async function (name) {
  logger.info(`Verifying the associated consultant is "${name}"`);
  await Chat.verifyConsultantInRecipients(this.page, name);
});

Then("the last message in the trip should be {string}", async function (message) {
  logger.info(`Verifying the last message in the trip is: "${message}"`);
  await Chat.verifyLastMessageInTrip(this.page, message);
});
