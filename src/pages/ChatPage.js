const SELECTORS = {
  OPEN_CHAT_BTN: ".chat-btn .material-symbols-outlined",
  NEW_CONVERSATION_BTN: ".chat-main .btn-container span",
  ADD_AGENT_BTN: ".agent-btn",
  MESSAGE_INPUT: "[placeholder='Enter your message']",
  MESSAGE_CONTENT: ".chat-message-content",
};

class ChatPage {
  constructor(page) {
    this.page = page;
  }

  async clickOpenChat() {
    const btn = this.page.locator(SELECTORS.OPEN_CHAT_BTN).first();
    try {
      await btn.waitFor({ state: "visible", timeout: 15000 });
      await btn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ChatPage.clickOpenChat] Could not click the chat open button (${SELECTORS.OPEN_CHAT_BTN}). The chat button may not be visible on this page. Original: ${err.message}`
      );
    }
  }

  async clickNewConversation() {
    const btn = this.page.locator(SELECTORS.NEW_CONVERSATION_BTN).first();
    try {
      await btn.waitFor({ state: "visible", timeout: 15000 });
      await btn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ChatPage.clickNewConversation] Could not click the new conversation button (${SELECTORS.NEW_CONVERSATION_BTN}). The chat panel may not be open or the button is not rendered. Original: ${err.message}`
      );
    }
  }

  async clickAddAgent() {
    const btn = this.page.locator(SELECTORS.ADD_AGENT_BTN).first();
    try {
      await btn.waitFor({ state: "visible", timeout: 15000 });
      await btn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ChatPage.clickAddAgent] Could not click the add agent button (${SELECTORS.ADD_AGENT_BTN}). The new conversation form may not be open. Original: ${err.message}`
      );
    }
  }

  async typeInMessageInput(message) {
    const input = this.page.locator(SELECTORS.MESSAGE_INPUT).first();
    try {
      await input.waitFor({ state: "visible", timeout: 15000 });
      await input.click({ timeout: 10000 });
      await input.fill(message, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ChatPage.typeInMessageInput] Could not type in the message input (${SELECTORS.MESSAGE_INPUT}). The chat message field may not be visible. Original: ${err.message}`
      );
    }
  }

  async clickSendMessage() {
    const btn = this.page.locator(SELECTORS.NEW_CONVERSATION_BTN).first();
    try {
      await btn.waitFor({ state: "visible", timeout: 15000 });
      await btn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ChatPage.clickSendMessage] Could not click the send message button (${SELECTORS.NEW_CONVERSATION_BTN}). The chat form may not be ready. Original: ${err.message}`
      );
    }
  }

  async waitForMessageInConversation(expectedText) {
    const messageContent = this.page.locator(SELECTORS.MESSAGE_CONTENT);
    try {
      await messageContent.first().waitFor({ state: "visible", timeout: 20000 });
      await this.page.waitForFunction(
        ([selector, text]) => {
          const elements = document.querySelectorAll(selector);
          return Array.from(elements).some(
            (el) => el.textContent.replace(/[\r\n]+/g, "").trim() === text.trim()
          );
        },
        [SELECTORS.MESSAGE_CONTENT, expectedText],
        { timeout: 20000 }
      );
    } catch (err) {
      throw new Error(
        `[ChatPage.waitForMessageInConversation] Message "${expectedText}" was not found in the chat conversation (${SELECTORS.MESSAGE_CONTENT}). The message may not have been sent or the conversation did not update. Original: ${err.message}`
      );
    }
  }
}

module.exports = { ChatPage, SELECTORS };
