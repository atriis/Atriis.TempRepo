const SELECTORS = {
  OPEN_CHAT_BTN: ".chat-btn .material-symbols-outlined",
  NEW_CONVERSATION_BTN: ".chat-main .btn-container span",
  ADD_AGENT_BTN: ".agent-btn",
  MESSAGE_INPUT: "[placeholder='Enter your message']",
  MESSAGE_CONTENT: ".chat-message-content",
  // Consultant search — user-autocomplete inside the new-chat participants form
  // (Atriis.OBT/modules/utils/chat/components/new-chat/new-chat.vue → user-autocomplete.vue)
  CONSULTANT_SEARCH_INPUT: ".new-chat .user-autocomplete input",
  // Autocomplete results render in a body-appended popper (popperClass "user-autocomplete-popper");
  // first suggestion carries an id ending in "item-0", the name sits in an <h2>.
  CONSULTANT_DROPDOWN_FIRST_OPTION: ".user-autocomplete-popper .el-autocomplete-suggestion__list li[id*='item-0']",
  // Selected participants (consultants + travelers) shown as trip-traveler-tag chips.
  RECIPIENTS_LIST: ".recipients-list",
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

  async typeInConsultantSearch(name) {
    const input = this.page.locator(SELECTORS.CONSULTANT_SEARCH_INPUT).first();
    try {
      await input.waitFor({ state: "visible", timeout: 15000 });
      await input.click({ timeout: 10000 });
      await input.fill(name, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ChatPage.typeInConsultantSearch] Could not type "${name}" in the consultant search input (${SELECTORS.CONSULTANT_SEARCH_INPUT}). The new conversation form may not be open. Original: ${err.message}`
      );
    }
  }

  async waitForConsultantInDropdown(name) {
    const firstOption = this.page.locator(SELECTORS.CONSULTANT_DROPDOWN_FIRST_OPTION);
    try {
      await firstOption.waitFor({ state: "visible", timeout: 15000 });
      const firstOptionName = firstOption.locator("h2").filter({ hasText: name });
      await firstOptionName.first().waitFor({ state: "visible", timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ChatPage.waitForConsultantInDropdown] Consultant "${name}" was not the first result in the search dropdown (${SELECTORS.CONSULTANT_DROPDOWN_FIRST_OPTION}). The search may not have returned results or a different user ranked first. Original: ${err.message}`
      );
    }
  }

  async clickFirstConsultantInDropdown() {
    const firstOption = this.page.locator(SELECTORS.CONSULTANT_DROPDOWN_FIRST_OPTION);
    try {
      await firstOption.waitFor({ state: "visible", timeout: 15000 });
      await firstOption.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ChatPage.clickFirstConsultantInDropdown] Could not click the first result in the consultant search dropdown (${SELECTORS.CONSULTANT_DROPDOWN_FIRST_OPTION}). The dropdown may have closed before selection. Original: ${err.message}`
      );
    }
  }

  async waitForConsultantInRecipients(name) {
    const recipient = this.page
      .locator(SELECTORS.RECIPIENTS_LIST)
      .locator(".traveler-name")
      .filter({ hasText: name });
    try {
      await recipient.first().waitFor({ state: "visible", timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ChatPage.waitForConsultantInRecipients] Consultant "${name}" was not found in the conversation recipients list (${SELECTORS.RECIPIENTS_LIST}). Selecting the consultant may not have added them as a participant. Original: ${err.message}`
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
