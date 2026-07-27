const { getPageObject } = require("@utils/pageObjectCache");
const { expect } = require("@playwright/test");
const { GenesysChatPage } = require("@pages/GenesysChatPage");
const logger = require("@utils/logger").child("GenesysChat");

// Workflows for the Genesys "chat with agent" floating widget.
// The trip conversation / consultant chat lives in Chat.js — different component.
const GenesysChat = {
  async openAgentChat(page) {
    if (!page) throw new Error('[GenesysChat.openAgentChat] page is required');
    const chatPage = getPageObject(page, GenesysChatPage);
    try {
      logger.debug("Opening the agent chat widget");
      await chatPage.clickLaunchChat();
      await chatPage.waitForChatWindow();
      return { opened: true };
    } catch (err) {
      throw new Error(
        `[GenesysChat.openAgentChat] Failed to open the agent chat widget. Ensure the chat launcher is visible on the current page. Original: ${err.message}`
      );
    }
  },

  async typeAgentChatMessage(page, message) {
    if (!page) throw new Error('[GenesysChat.typeAgentChatMessage] page is required');
    if (!message || typeof message !== 'string') {
      throw new Error(`[GenesysChat.typeAgentChatMessage] "message" must be a non-empty string, got: ${typeof message}`);
    }
    const chatPage = getPageObject(page, GenesysChatPage);
    try {
      logger.debug(`Typing message in the agent chat: "${message}"`);
      await chatPage.typeInMessageField(message);
      return { typed: true, message };
    } catch (err) {
      throw new Error(
        `[GenesysChat.typeAgentChatMessage] Failed to type message "${message}" in the agent chat message field. The chat window may not be open. Original: ${err.message}`
      );
    }
  },

  async sendAgentChatMessage(page) {
    if (!page) throw new Error('[GenesysChat.sendAgentChatMessage] page is required');
    const chatPage = getPageObject(page, GenesysChatPage);
    try {
      logger.debug("Sending the agent chat message");
      await chatPage.clickSendMessage();
      // The widget ignores an empty/whitespace message without any visible error,
      // so confirm the field was consumed rather than assuming the click worked.
      await chatPage.waitForMessageFieldCleared();
      return { sent: true };
    } catch (err) {
      throw new Error(
        `[GenesysChat.sendAgentChatMessage] Failed to send the agent chat message. Original: ${err.message}`
      );
    }
  },

  async verifyAgentChatMessageDisplayed(page, message) {
    if (!page) throw new Error('[GenesysChat.verifyAgentChatMessageDisplayed] page is required');
    if (!message || typeof message !== 'string') {
      throw new Error(`[GenesysChat.verifyAgentChatMessageDisplayed] "message" must be a non-empty string, got: ${typeof message}`);
    }
    const chatPage = getPageObject(page, GenesysChatPage);
    logger.debug(`Verifying the agent chat transcript shows the sent message "${message}"`);
    const bubble = chatPage.getSentMessageBubbleByText(message);
    await expect(
      bubble,
      `Expected the sent message "${message}" to appear in the agent chat transcript`
    ).toBeVisible({ timeout: 15000 });
    return { displayed: true, message };
  },

  async closeAgentChat(page) {
    if (!page) throw new Error('[GenesysChat.closeAgentChat] page is required');
    const chatPage = getPageObject(page, GenesysChatPage);
    try {
      logger.debug("Closing the agent chat widget");
      await chatPage.clickCloseChat();
      // Closing never dismisses the widget directly — it raises a confirmation overlay.
      await chatPage.waitForCloseWarning();
      return { closed: false, closeWarningDisplayed: true };
    } catch (err) {
      throw new Error(
        `[GenesysChat.closeAgentChat] Failed to close the agent chat. The chat window may not be open. Original: ${err.message}`
      );
    }
  },

  async confirmEndAgentChat(page) {
    if (!page) throw new Error('[GenesysChat.confirmEndAgentChat] page is required');
    const chatPage = getPageObject(page, GenesysChatPage);
    try {
      logger.debug("Confirming End chat on the close-confirmation overlay");
      await chatPage.clickEndChat();
      await chatPage.waitForChatWindowClosed();
      return { ended: true, chatWindowClosed: true };
    } catch (err) {
      throw new Error(
        `[GenesysChat.confirmEndAgentChat] Failed to confirm ending the agent chat. The close-confirmation overlay may not be open. Original: ${err.message}`
      );
    }
  },

  async verifyAgentChatClosed(page) {
    if (!page) throw new Error('[GenesysChat.verifyAgentChatClosed] page is required');
    const chatPage = getPageObject(page, GenesysChatPage);
    logger.debug("Verifying the agent chat widget is closed and the launcher is back");
    await expect(
      chatPage.getChatWindow(),
      "Expected the agent chat window to be hidden after ending the chat"
    ).toBeHidden({ timeout: 15000 });
    // endChat() flips isShowModal back to false, which re-renders the launcher
    // (v-if="!isShowModal") — its return is what proves the widget fully reset.
    await expect(
      chatPage.getLaunchButton(),
      "Expected the agent chat launcher to be visible again after ending the chat"
    ).toBeVisible({ timeout: 15000 });
    return { closed: true, launcherVisible: true };
  },
};

module.exports = GenesysChat;
