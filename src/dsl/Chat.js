const { getPageObject } = require("@utils/pageObjectCache");
const { expect } = require("@playwright/test");
const { ChatPage } = require("@pages/ChatPage");
const logger = require("@utils/logger").child("Chat");

const Chat = {
  async openChat(page) {
    if (!page) throw new Error('[Chat.openChat] page is required');
    const chatPage = getPageObject(page, ChatPage);
    try {
      logger.debug("Opening chat panel");
      await chatPage.clickOpenChat();
    } catch (err) {
      throw new Error(
        `[Chat.openChat] Failed to open the chat panel. Ensure the chat button is visible on the current page. Original: ${err.message}`
      );
    }
  },

  async startNewChatConversation(page) {
    if (!page) throw new Error('[Chat.startNewChatConversation] page is required');
    const chatPage = getPageObject(page, ChatPage);
    try {
      logger.debug("Starting new chat conversation");
      await chatPage.clickNewConversation();
    } catch (err) {
      throw new Error(
        `[Chat.startNewChatConversation] Failed to start a new chat conversation. The chat panel may not be open. Original: ${err.message}`
      );
    }
  },

  async addAgentToChat(page) {
    if (!page) throw new Error('[Chat.addAgentToChat] page is required');
    const chatPage = getPageObject(page, ChatPage);
    try {
      logger.debug("Adding agent/consultant to chat");
      await chatPage.clickAddAgent();
    } catch (err) {
      throw new Error(
        `[Chat.addAgentToChat] Failed to add an agent to the chat. The new conversation form may not be open or the add agent button is not visible. Original: ${err.message}`
      );
    }
  },

  async searchConsultant(page, name) {
    if (!page) throw new Error('[Chat.searchConsultant] page is required');
    if (!name || typeof name !== 'string') {
      throw new Error(`[Chat.searchConsultant] "name" must be a non-empty string, got: ${typeof name}`);
    }
    const chatPage = getPageObject(page, ChatPage);
    try {
      logger.debug(`Searching for consultant "${name}" in the new conversation form`);
      await chatPage.typeInConsultantSearch(name);
    } catch (err) {
      throw new Error(
        `[Chat.searchConsultant] Failed to search for consultant "${name}". The new conversation form may not be open. Original: ${err.message}`
      );
    }
  },

  async verifyConsultantInDropdown(page, name) {
    if (!page) throw new Error('[Chat.verifyConsultantInDropdown] page is required');
    if (!name || typeof name !== 'string') {
      throw new Error(`[Chat.verifyConsultantInDropdown] "name" must be a non-empty string, got: ${typeof name}`);
    }
    const chatPage = getPageObject(page, ChatPage);
    try {
      logger.debug(`Verifying consultant "${name}" is the first result in the search dropdown`);
      await chatPage.waitForConsultantInDropdown(name);
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Chat.verifyConsultantInDropdown] Consultant "${name}" did not appear as the first result in the search dropdown. Original: ${err.message}`
      );
    }
  },

  async selectConsultantFromDropdown(page) {
    if (!page) throw new Error('[Chat.selectConsultantFromDropdown] page is required');
    const chatPage = getPageObject(page, ChatPage);
    try {
      logger.debug("Selecting the first consultant from the search dropdown");
      await chatPage.clickFirstConsultantInDropdown();
    } catch (err) {
      throw new Error(
        `[Chat.selectConsultantFromDropdown] Failed to select the first consultant from the search dropdown. The dropdown may not be open. Original: ${err.message}`
      );
    }
  },

  async verifyConsultantInRecipients(page, name) {
    if (!page) throw new Error('[Chat.verifyConsultantInRecipients] page is required');
    if (!name || typeof name !== 'string') {
      throw new Error(`[Chat.verifyConsultantInRecipients] "name" must be a non-empty string, got: ${typeof name}`);
    }
    const chatPage = getPageObject(page, ChatPage);
    try {
      logger.debug(`Verifying consultant "${name}" appears in the conversation recipients list`);
      await chatPage.waitForConsultantInRecipients(name);
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Chat.verifyConsultantInRecipients] Consultant "${name}" was not shown in the conversation recipients list. Original: ${err.message}`
      );
    }
  },

  async selectTravelerInConversation(page, traveler) {
    if (!page) throw new Error('[Chat.selectTravelerInConversation] page is required');
    if (!traveler || typeof traveler !== 'string') {
      throw new Error(`[Chat.selectTravelerInConversation] "traveler" must be a non-empty string (name or email), got: ${typeof traveler}`);
    }
    const chatPage = getPageObject(page, ChatPage);
    try {
      // The new-chat participant field is the shared user-autocomplete; searching by the
      // traveler's name/email and picking the first suggestion adds them to the conversation.
      logger.debug(`Selecting traveler "${traveler}" from the conversation participant search`);
      await chatPage.typeInConsultantSearch(traveler);
      await chatPage.clickFirstConsultantInDropdown();
    } catch (err) {
      throw new Error(
        `[Chat.selectTravelerInConversation] Failed to select traveler "${traveler}" in the conversation form. The new conversation form may not be open or the search returned no matching user. Original: ${err.message}`
      );
    }
  },

  async navigateBackFromChat(page) {
    if (!page) throw new Error('[Chat.navigateBackFromChat] page is required');
    const chatPage = getPageObject(page, ChatPage);
    try {
      logger.debug("Navigating back from the chat conversation to the trip");
      await chatPage.clickBackFromChat();
    } catch (err) {
      throw new Error(
        `[Chat.navigateBackFromChat] Failed to navigate back from the chat to the trip. The back button may not be visible in the conversation view. Original: ${err.message}`
      );
    }
  },

  async typeMessageInChat(page, message) {
    if (!page) throw new Error('[Chat.typeMessageInChat] page is required');
    if (!message || typeof message !== 'string') {
      throw new Error(`[Chat.typeMessageInChat] "message" must be a non-empty string, got: ${typeof message}`);
    }
    const chatPage = getPageObject(page, ChatPage);
    try {
      logger.debug(`Typing message in chat: "${message}"`);
      await chatPage.typeInMessageInput(message);
    } catch (err) {
      throw new Error(
        `[Chat.typeMessageInChat] Failed to type message "${message}" in the chat message field. Original: ${err.message}`
      );
    }
  },

  async sendChatMessage(page) {
    if (!page) throw new Error('[Chat.sendChatMessage] page is required');
    const chatPage = getPageObject(page, ChatPage);
    try {
      logger.debug("Sending chat message");
      await chatPage.clickSendMessage();
    } catch (err) {
      throw new Error(
        `[Chat.sendChatMessage] Failed to send the chat message. The send button may not be enabled. Original: ${err.message}`
      );
    }
  },

  async verifyChatMessageDisplayed(page, message) {
    if (!page) throw new Error('[Chat.verifyChatMessageDisplayed] page is required');
    if (!message || typeof message !== 'string') {
      throw new Error(`[Chat.verifyChatMessageDisplayed] "message" must be a non-empty string, got: ${typeof message}`);
    }
    const chatPage = getPageObject(page, ChatPage);
    try {
      logger.debug(`Verifying message "${message}" appears in chat conversation`);
      await chatPage.waitForMessageInConversation(message);
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Chat.verifyChatMessageDisplayed] Message "${message}" was not displayed in the chat conversation. Original: ${err.message}`
      );
    }
  },

  async verifyLastMessageInTrip(page, message) {
    if (!page) throw new Error('[Chat.verifyLastMessageInTrip] page is required');
    if (!message || typeof message !== 'string') {
      throw new Error(`[Chat.verifyLastMessageInTrip] "message" must be a non-empty string, got: ${typeof message}`);
    }
    const chatPage = getPageObject(page, ChatPage);
    try {
      logger.debug(`Verifying last message in trip conversation list: "${message}"`);
      await chatPage.waitForLastMessageInTrip(message);
    } catch (err) {
      throw new Error(
        `[Chat.verifyLastMessageInTrip] Last message "${message}" was not shown in the trip conversation list. Original: ${err.message}`
      );
    }
  },
};

module.exports = Chat;
