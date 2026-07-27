// Genesys "chat with agent" widget — a floating chat launcher available across the app.
// Source: Atriis.OBT/src/components/app-genesys/app-genesys.vue (+ .ts)
//
// NOT the same component as ChatPage.js, which models the trip conversation /
// consultant chat (.chat-btn, .chat-main, .new-chat). The two share no selectors.
const SELECTORS = {
  // Floating launcher; hidden (v-if="!isShowModal") while the chat window is open.
  LAUNCH_BTN: ".chat-launch-btn",
  CHAT_WINDOW: ".chat-window",
  MESSAGE_FIELD: ".chat-window__field",
  SEND_ICON: ".chat-window__send-icon",
  // Header close button. Does not close the widget directly — chatToggle() raises
  // the close-confirmation overlay below.
  CLOSE_BTN: ".chat-window__close",
  CLOSE_WARNING: ".chat-window__close-warning",
  // Overlay actions, in DOM order: 1st = End chat (endChat), 2nd = Back to chat (backToChat).
  END_CHAT_BTN: ".chat-window__warning-actions .chat-window__link",
  // Messages sent by the traveler; agent replies carry .is-agent instead.
  SENT_MESSAGE_BUBBLE: ".chat-window__message.is-you .chat-window__bubble",
};

class GenesysChatPage {
  constructor(page) {
    this.page = page;
  }

  async clickLaunchChat() {
    const btn = this.page.locator(SELECTORS.LAUNCH_BTN).first();
    try {
      await btn.waitFor({ state: "visible", timeout: 15000 });
      await btn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[GenesysChatPage.clickLaunchChat] Could not click the agent chat launch button (${SELECTORS.LAUNCH_BTN}). The widget may not be rendered on this page, or the chat window is already open. Original: ${err.message}`
      );
    }
  }

  async waitForChatWindow() {
    const window = this.page.locator(SELECTORS.CHAT_WINDOW).first();
    try {
      await window.waitFor({ state: "visible", timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[GenesysChatPage.waitForChatWindow] The agent chat window (${SELECTORS.CHAT_WINDOW}) did not become visible. Original: ${err.message}`
      );
    }
  }

  async waitForChatWindowClosed() {
    const window = this.page.locator(SELECTORS.CHAT_WINDOW).first();
    try {
      await window.waitFor({ state: "hidden", timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[GenesysChatPage.waitForChatWindowClosed] The agent chat window (${SELECTORS.CHAT_WINDOW}) was still visible after ending the chat. Original: ${err.message}`
      );
    }
  }

  async typeInMessageField(message) {
    const input = this.page.locator(SELECTORS.MESSAGE_FIELD).first();
    try {
      await input.waitFor({ state: "visible", timeout: 15000 });
      await input.click({ timeout: 10000 });
      await input.fill(message, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[GenesysChatPage.typeInMessageField] Could not type "${message}" in the agent chat message field (${SELECTORS.MESSAGE_FIELD}). The chat window may not be open. Original: ${err.message}`
      );
    }
  }

  async clickSendMessage() {
    const icon = this.page.locator(SELECTORS.SEND_ICON).first();
    try {
      await icon.waitFor({ state: "visible", timeout: 15000 });
      await icon.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[GenesysChatPage.clickSendMessage] Could not click the agent chat send icon (${SELECTORS.SEND_ICON}). The chat window may not be open. Original: ${err.message}`
      );
    }
  }

  // sendMessage() clears the bound input once the message is queued, so an empty
  // field is the signal that the send was accepted rather than silently ignored.
  async waitForMessageFieldCleared() {
    const input = this.page.locator(SELECTORS.MESSAGE_FIELD).first();
    try {
      await input.waitFor({ state: "visible", timeout: 15000 });
      await this.page.waitForFunction(
        (selector) => {
          const el = document.querySelector(selector);
          return Boolean(el) && el.value.trim() === "";
        },
        SELECTORS.MESSAGE_FIELD,
        { timeout: 15000 }
      );
    } catch (err) {
      throw new Error(
        `[GenesysChatPage.waitForMessageFieldCleared] The agent chat message field (${SELECTORS.MESSAGE_FIELD}) was not cleared after sending. The message may not have been sent. Original: ${err.message}`
      );
    }
  }

  async clickCloseChat() {
    const btn = this.page.locator(SELECTORS.CLOSE_BTN).first();
    try {
      await btn.waitFor({ state: "visible", timeout: 15000 });
      await btn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[GenesysChatPage.clickCloseChat] Could not click the close button in the agent chat header (${SELECTORS.CLOSE_BTN}). The chat window may not be open. Original: ${err.message}`
      );
    }
  }

  async waitForCloseWarning() {
    const warning = this.page.locator(SELECTORS.CLOSE_WARNING).first();
    try {
      await warning.waitFor({ state: "visible", timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[GenesysChatPage.waitForCloseWarning] The agent chat close-confirmation overlay (${SELECTORS.CLOSE_WARNING}) did not appear. Original: ${err.message}`
      );
    }
  }

  getChatWindow() {
    return this.page.locator(SELECTORS.CHAT_WINDOW).first();
  }

  getLaunchButton() {
    return this.page.locator(SELECTORS.LAUNCH_BTN).first();
  }

  getSentMessageBubbleByText(message) {
    if (!message || typeof message !== "string") {
      throw new Error(
        `[GenesysChatPage.getSentMessageBubbleByText] "message" must be a non-empty string, got: ${typeof message}`
      );
    }
    return this.page
      .locator(SELECTORS.SENT_MESSAGE_BUBBLE)
      .filter({ hasText: message })
      .first();
  }

  async clickEndChat() {
    const btn = this.page.locator(SELECTORS.END_CHAT_BTN).first();
    try {
      await btn.waitFor({ state: "visible", timeout: 15000 });
      await btn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[GenesysChatPage.clickEndChat] Could not click the End chat action on the close-confirmation overlay (${SELECTORS.END_CHAT_BTN}). The overlay may not be open. Original: ${err.message}`
      );
    }
  }
}

module.exports = { GenesysChatPage, SELECTORS };
