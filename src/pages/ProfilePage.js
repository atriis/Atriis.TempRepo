const { expect } = require("@playwright/test");
const { EL_SELECT_DISABLED_INNER } = require("@utils/elementPlus");
// The header dropdown's Log out button is owned by MenuPage (App.clickLogout clicks it there).
// Imported rather than redeclared so the two never drift apart.
const { SELECTORS: MENU_SELECTORS } = require("@pages/MenuPage");

const SELECTORS = {
  // Navigation to profile.
  // As of app v2.13 the header avatar is wrapped by app-profile-menu.vue: an el-tooltip with
  // trigger="click" whose content (teleported into an .el-popper) holds "My profile", the
  // permission-gated "Manage profiles" and "Log out". The avatar itself is rendered with
  // isTooltipDisabled, so hovering it no longer reveals anything — the trigger must be CLICKED.
  // The old hover target `.user-profile-link` still exists, but only inside the traveler-avatar
  // tooltip on trip pages, never in the header. Same selectors MenuPage uses for logout.
  // Each selector accepts the component's data-testid or its class, so neither being absent
  // in a given deployment breaks navigation.
  PROFILE_MENU_TRIGGER: '[data-testid="profile-menu.trigger"], .app-profile-menu .avatar-trigger',
  MY_PROFILE_MENU_ITEM: '[data-testid="profile-menu.my-profile"], .profile-menu-item.my-profile-item',
  // Sibling of "My profile" in the same dropdown, but rendered only when the logged-in user
  // holds "Can view profile of other users" AND the manage-profiles feature flag is on
  // (app-profile-menu.ts: canManageProfiles). It sits behind a v-if, so for everyone else the
  // node is absent from the DOM entirely rather than merely hidden - which is what the
  // absence assertion in 83407 leans on.
  MANAGE_PROFILES_MENU_ITEM:
    '[data-testid="profile-menu.manage-profiles"], .profile-menu-item.manage-profiles-item',

  // The dropdown itself. el-tooltip teleports its #content into a .el-popper carrying the
  // component's popper-class, so the panel is NOT a descendant of .app-profile-menu and cannot be
  // reached from the trigger. Scoping every option lookup to this panel is what makes the ABSENCE
  // assertion mean something: an unscoped "Manage profiles is not visible" check passes just as
  // happily against a menu that never opened.
  PROFILE_MENU_CONTENT: '.el-popper.profile-menu-tooltip:not([aria-hidden="true"]) .profile-menu-content',
  // "Log out" is deliberately absent here — see MENU_SELECTORS.LOGOUT_ICON above.

  // Profile tabs
  FREQUENT_PROGRAMS_TAB: '#tab-frequentPrograms',
  CONTACT_INFORMATION_TAB: "[id='tab-contactInformation'] p",
  TRAVEL_PREFERENCES_TAB: "[id='tab-travelPreferences'] p",
  PERSONAL_DETAILS_TAB: "[id='tab-personalDetails'] p",

  // Contact information form
  CONTACT_INFO_FORM: '.contact-info-form-content',

  SAVE_CONTACT_INFO_BUTTON: '.contact-info-form-content button:has-text("Save")',
  BUSINESS_PHONE_DIAL: '.contact-info-form-content .phone-inputs-container .field.app-column.is-3:nth-child(2) .app-phone-input__dial',
  BUSINESS_PHONE_AREA: '.contact-info-form-content .phone-inputs-container .field.app-column.is-3:nth-child(2) .app-phone-input__area',
  BUSINESS_PHONE_NUMBER: '.contact-info-form-content .phone-inputs-container .field.app-column.is-3:nth-child(2) .app-phone-input__number',
  STATE_LABEL: '.contact-info-form-content > :nth-child(6) > :nth-child(5) .label',
  STATE_VALUE: '.contact-info-form-content > :nth-child(6) > :nth-child(5) .el-select__placeholder span',

  // Travel preferences form
  TRAVEL_PREFERENCES_FORM: '.travel-preferences-form-content',
  SAVE_TRAVEL_PREFERENCES_BUTTON: '.travel-preferences-form-content button:has-text("Save")',
  SEAT_TYPE_LABEL: 'Seat type',

  // Permissions tab
  PERMISSIONS_TAB: "[id='tab-permissions'] p",
  PERMISSIONS_SECTION_TAB: '.permissions-form .tabs-container [id*="tab-travellers"] p',
  PERMISSIONS_USER_SELECT: '.travel-arranger-table .user-select',
  PERMISSIONS_ARRANGER_ROW: '.travel-arranger-table .arranger-row',
  PERMISSIONS_TRASH_ICON: '.travel-arranger-table .trash-icon',
  PERMISSIONS_NO_ARRANGERS: '.travel-arranger-table .no-arrangers',
  TRAVEL_ARRANGER_INPUT: '.travel-arranger-table .user-select input',
  TRAVEL_ARRANGER_DROPDOWN_OPTION: '.el-vl__window span',
  TRAVEL_ARRANGER_SELECTED: '.travel-arranger-table .user-select .el-select__placeholder',

  // Traveler profile from trip page
  TRAVELER_NAME_LINK: '.trip-traveler-tag .traveler-name.is-clickable',
  // Same tag, restricted to a FILLED traveller. trip-traveler-tag.vue gives both of its branches
  // `traveler-name` + `is-clickable`, so TRAVELER_NAME_LINK above also matches the empty
  // "Select Traveller" placeholder — clicking that opens the Add-traveller dialog instead of the
  // profile. `black` is on the v-if="!empty" branch only, which is what separates the two; keying
  // on it rather than on the placeholder's `select-traveler` class because staging does not ship
  // that class yet (see SearchPage.SELECT_TRAVELER_SLOT). Callers that identify the tag by
  // position, rather than by name, must use this selector.
  FILLED_TRAVELER_NAME_LINK: '.trip-traveler-tag .traveler-name.black.is-clickable',
  PERSONAL_DETAILS_FORM: '.personal-details-form-content',
  DOB_INPUT: '.personal-details-form-content .birth-date-date-picker input',
  SAVE_PERSONAL_DETAILS_BUTTON: '.personal-details-form-content button:has-text("Save")',
  BACKUP_APPROVER_LABEL: 'Backup approver',
  // Personal Details — Time format radio group. personal-details-form.vue renders two adjacent
  // el-radio-groups (Time format, then First day) inside sibling .field.app-column blocks, so the
  // group has to be reached through its own label or a positional selector would flip between
  // them. Held as label text for the same reason SEAT_TYPE_LABEL is: the .field.app-column +
  // label.label:text-is() pattern below is what scopes it.
  TIME_FORMAT_LABEL: 'Time format',

  // Personal Details — name inputs (Title is the first label in the first field)
  // TODO: replace with data-testid once added to personal-details-form.vue — :nth-child(1) is fragile if field order changes
  TITLE_FIELD_LABEL: '.name-inputs-container > :nth-child(1) .label',

  // Personal Details — dynamic reference fields
  DYNAMIC_FIELD_CONTAINER: '.reference-fields-container',
  DYNAMIC_FIELD_WARNING: '.reference-fields-container .form-validation-msg',
  DYNAMIC_FIELD_SELECT_VALUE: '.reference-fields-container .el-select__placeholder span',
  DYNAMIC_FIELD_LABEL: '.reference-fields-container > :nth-child(2) .label',
  DYNAMIC_FIELD_INFO_ICON: '.reference-fields-container .info-icon',
  DYNAMIC_FIELD_TOOLTIP: '.el-popper.is-light:not([aria-hidden="true"]) .help',

  // Frequent Programs form
  FREQUENT_PROGRAMS_FORM: '.frequent-programs-form',
  FREQUENT_PROGRAMS_INPUTS: '.frequent-programs-inputs',
  ADD_FREQUENT_FLYER_BUTTON: '.add-loyalty-btn',
  REMOVE_ENTRY_BUTTON: '.remove-btn-wrapper .remove-btn',
  FF_NUMBER_INPUT: '.el-input__inner',
  FF_CARRIER_DROPDOWN: '.el-select',
  // The only button in the form's footer. Anchored on structure, not text: the label is
  // "Save" + the frequentPrograms tab label, which app commit 05139b0e (AB#81039, "Normalise the
  // OBT master English content to consistent English (UK)") changed from "Frequent Programs" to
  // "Frequent Programmes" in en.json while leaving en-US.json on the US spelling — so any text
  // match here breaks on whichever of the two English locales the corporation is configured for.
  SAVE_BUTTON: '.frequent-programs-form-content > .btns-container button',

  // BahnCard (Deutsche Bahn) loyalty rows — the last block of the "Other programs" section in
  // frequent-programs-form.vue. Car, rail and BahnCard rows all carry the same
  // `.frequent-flyer-inputs` class, so the BahnCard row is anchored on the two controls only it
  // renders: `.db-rail-program-number-input` and `.valid-until-date-picker`.
  // The add button is matched on "BahnCard" rather than its full label because en.json says
  // "programme" and en-US.json "program" (same trap as SAVE_BUTTON above) — "BahnCard" is stable
  // across both and appears in none of the other five `.add-loyalty-btn` labels.
  BAHNCARD_ADD_BUTTON: '.frequent-programs-form .add-loyalty-btn:has-text("BahnCard")',
  BAHNCARD_ROW: '.frequent-flyer-inputs:has(.db-rail-program-number-input)',
  BAHNCARD_TYPE_SELECT: '.app-select',
  BAHNCARD_NUMBER_INPUT: '.db-rail-program-number-input input',
  BAHNCARD_VALID_UNTIL_INPUT: '.valid-until-date-picker input',

  // Rendered only while a field is invalid AND the form has been submitted once (markFields).
  FREQUENT_PROGRAMS_VALIDATION_MSG: '.frequent-programs-form .validation-msg',

  // Form of Payment tab
  FORM_OF_PAYMENT_TAB: "[id='tab-formOfPayment'] p",
  FOP_SECTION: '.profile-form-of-payment',
  FOP_ADD_CARD_BUTTON: '.profile-form-of-payment .add-card-btn',
  FOP_FORM: '.profile-form-of-payment-content',
  FOP_CARD_DISPLAY_NAME_INPUT: '.profile-form-of-payment-content .field.app-column.is-2:nth-child(1) input',
  FOP_CARD_TYPE_SELECT: '.profile-form-of-payment-content .credit-type-select',
  FOP_CARD_HOLDER_INPUT: '.profile-form-of-payment-content .field.app-column.is-2:nth-child(3) input',
  FOP_INSERT_CARD_NUMBER_BUTTON: '.profile-form-of-payment-content .insert-card-btn',
  FOP_CARD_NUMBER_MODAL_INPUT: '.payment-modal .insert-card input',
  FOP_CARD_NUMBER_MODAL_SAVE: '.payment-modal button:has-text("Save")',
  FOP_EXPIRY_MONTH_SELECT: '.profile-form-of-payment-content .expiration-inputs .app-column:nth-child(1) .el-select',
  FOP_EXPIRY_YEAR_SELECT: '.profile-form-of-payment-content .expiration-inputs .app-column:nth-child(2) .el-select',
  FOP_ADDRESS_INPUT: '.profile-form-of-payment-content .app-columns:nth-child(2) .field.app-column.is-3:nth-child(1) input',
  FOP_CITY_INPUT: '.profile-form-of-payment-content .app-columns:nth-child(2) .field.app-column.is-3:nth-child(2) input',
  FOP_ZIP_INPUT: '.profile-form-of-payment-content .app-columns:nth-child(2) .field.app-column.is-3:nth-child(3) input',
  FOP_COUNTRY_SELECT: '.profile-form-of-payment-content .app-columns:nth-child(2) .field.app-column.is-3:nth-child(4) .el-select',
  FOP_STATE_SELECT: '.profile-form-of-payment-content .app-columns:nth-child(2) .field.app-column:nth-child(5) .el-select',
  FOP_SAVE_BUTTON: '.profile-form-of-payment-content button:has-text("Save")',
  FOP_CARD_PREVIEW: '.profile-form-of-payment .card-preview',
  FOP_CARD_NAME_DISPLAY: '.profile-form-of-payment .card-name',
  FOP_CARD_HOLDER_NAME_DISPLAY: '.profile-form-of-payment .card-holder-name',
  FOP_CARD_ACTIONS_DROPDOWN: '.profile-form-of-payment .card-preview .actions-dropdown .expand-icon',
  FOP_DELETE_CARD_OPTION: '.share-popper .el-dropdown-menu__item:last-child p',

  // Passports & Visas tab
  PASSPORTS_VISAS_TAB: "[id='tab-passportsAndVisas'] p",
  PASSPORT_VISA_FORM: '.passport-visa-form',
  PASSPORT_INPUTS: '.passport-inputs',
  VISA_INPUTS_CONTAINER: '.visa-inputs-container',
  VISA_INPUTS: '.visa-inputs',
  VISA_COUNTRY_SELECT: '.visa-inputs .field.app-column:nth-child(1) .el-select',
  VISA_VALID_UNTIL_INPUT: '.visa-inputs .field.app-column:nth-child(2) .app-datepicker input',
  VISA_NUMBER_INPUT: '.visa-inputs .field.app-column:nth-child(3) input',
  VISA_REMOVE_BUTTON: '.visa-inputs .remove-btn-wrapper .remove-btn',
  SAVE_PASSPORTS_VISAS_BUTTON: '.passport-visa-form .btns-container button',
  KNOWN_TRAVELER_INPUT: '.additional-inputs-container .field.app-column:first-child input',
  DATE_PICKER_PANEL: '.el-picker-panel:visible',
  DATE_PICKER_NEXT_YEAR_ARROW: 'button.el-picker-panel__icon-btn.d-arrow-right:visible',

  // Confirm delete dialog
  CONFIRM_DELETE_BUTTON: 'button:has-text("Yes, Delete")',

  // Dropdown options
  DROPDOWN_OPTION: '.el-select-dropdown__item',

  // User profile dialog popup — shown when mandatory profile fields are missing on "add myself"
  USER_PROFILE_DIALOG: '.app-dialog.user-profile-dialog',
  // Mandatory field label in the popup contact info form — gets class `mandatory` via Vue binding
  PROFILE_POPUP_MANDATORY_LABEL: '.user-profile-dialog .contact-info-form-content label.mandatory',
  // Validation message shown below invalid phone inputs (e.g. "Invalid phone number")
  PROFILE_POPUP_VALIDATION_MSG: '.user-profile-dialog .contact-info-form-content p.help',
  // Info message rendered when markFields is true and the form is invalid
  PROFILE_POPUP_INFO_MSG: '.user-profile-dialog .contact-info-form-content .btns-container .is-word-break',
  // Mobile field in popup uses app-phone-input component: country=dropdown button, area+number=text inputs
  PROFILE_POPUP_MOBILE_COUNTRY_BTN: '.user-profile-dialog .contact-info-form-content .phone-inputs-container .field.app-column.is-3:first-child .app-phone-input__country',
  PROFILE_POPUP_MOBILE_AREA: '.user-profile-dialog .contact-info-form-content .phone-inputs-container .field.app-column.is-3:first-child .app-phone-input__area',
  PROFILE_POPUP_MOBILE_NUMBER: '.user-profile-dialog .contact-info-form-content .phone-inputs-container .field.app-column.is-3:first-child .app-phone-input__number',
  // Country-code dropdown popover — teleported to <body> by el-popover, one visible at a time
  // :visible scopes to the active popover; all 5 phone-field popovers share the same body-level class
  PHONE_INPUT_POPOVER_SEARCH: '.app-phone-input-popover .app-phone-input__search input:visible',
  PHONE_INPUT_POPOVER_OPTION: '.app-phone-input-popover:visible .app-phone-input__option',
  // Save button inside the popup contact info form
  PROFILE_POPUP_SAVE_BTN: '.user-profile-dialog button:has-text("Save")',
  // --- Mandate-fields dialogs (ADO US 60526) ---
  // trip-app.vue renders BOTH the editable profile dialog and the read-only
  // "Mandatory Details Are Missing" warning with the same class
  // (.app-dialog.user-profile-dialog) — only the el-dialog title tells them apart, so every
  // check below is title-scoped. Which one opens is decided by the profile response:
  // showWarningPopup -> warning dialog, otherwise mandateFields.length -> editable profile.
  DIALOG_TITLE: ".el-dialog__title",
  USER_PROFILE_DIALOG_TITLE_TEXT: "User profile",
  MANDATORY_DETAILS_DIALOG_TITLE_TEXT: "Mandatory Details Are Missing",
  // Body of whichever user-profile dialog is open
  USER_PROFILE_DIALOG_BODY: ".el-dialog__body",
  // Active tab inside the open dialog. user-profile.ts#setActiveTabWithFirstMandateField sends
  // the popup to the tab holding the first missing mandate field, so the active tab is itself
  // an assertion target — its el-tab-pane name is exposed as the `tab-<name>` element id.
  DIALOG_ACTIVE_TAB: ".el-tabs__item.is-active",
  // el-dialog's own header close button — used to leave one traveller's popup before selecting
  // the next traveller, deliberately WITHOUT saving.
  DIALOG_CLOSE_BTN: ".el-dialog__headerbtn",
  // The red star is the `mandatory` class on a field's label. personal-details-form.vue hardcodes
  // `class="label mandatory"` on firstName/lastName/email/language/currency, so counting
  // `label.mandatory` passes even when nothing is configured as a mandate field. Only the
  // Date of Birth label is bound to the mandate config
  // (:class="{ mandatory: checkIsMandateField(mandateFieldTypes.DateOfBirth) }"), so it is the
  // one label that actually proves the mandate-field rule is being applied.
  PROFILE_DIALOG_DOB_FIELD_LABEL: ".personal-details-form-content .field:has(.birth-date-date-picker) label",
  PROFILE_DIALOG_MANDATORY_CLASS: "mandatory",
  // The Email input on the popup's Personal Details tab is the traveller's identity as the popup
  // itself sees it: personal-details-form.vue binds it to the loaded profile's `formData.email`.
  // Asserting it is what proves the popup that opened belongs to the traveller who was selected,
  // rather than staying on the booker's own profile. The header <h1> is not usable for this — it
  // renders firstName + lastName, which the test only knows as an email address. Matched by exact
  // label text so the sibling "CC Email" field in the same form cannot satisfy it.
  PROFILE_DIALOG_EMAIL_INPUT: ".personal-details-form-content .field:has(> label:text-is(\"Email\")) input",
  // The profile forms only render Save when editable (v-if="!disableEdit" in
  // contact-info-form.vue), so its absence is how a read-only profile popup is detected.
  PROFILE_DIALOG_SAVE_BTN: "button:has-text(\"Save\")",
  // Read-only profile forms disable every input, so an editable input is the second
  // editability signal alongside the Save button
  PROFILE_DIALOG_ANY_INPUT: "input:visible",
  PROFILE_DIALOG_EDITABLE_INPUT: "input:visible:not([disabled])",

  // --- Standalone traveler profile PAGE (not the dialog) ---
  // Clicking a traveller's name on the trip/search page does NOT open a dialog: trip-traveler-tag.vue
  // #goToUserApp calls utilService.openNewWindow(false, ...), which on desktop window.open()s the
  // /user/:userId route. That route renders user-profile.vue standalone (user-app.vue), so the
  // .app-dialog.user-profile-dialog wrapper every USER_PROFILE_DIALOG selector above relies on is
  // absent here. user-profile.vue puts `blend-into-modal` on its section ONLY when embedded in a
  // dialog, so :not(.blend-into-modal) is what separates the standalone page from the popup.
  USER_PROFILE_PAGE: "section.user-profile:not(.blend-into-modal)",
  // Same section gains `read-only-profile` when user-profile.ts#isUserCantEditProfile is true
  // (another user's profile without CanEditAndViewProfile), so this class is the app's own
  // read-only signal — asserted alongside the Save-button/editable-input counts.
  USER_PROFILE_PAGE_READ_ONLY: "section.user-profile.read-only-profile:not(.blend-into-modal)",
  // The tabbed forms mount inside the section; used to wait out the profile load before counting
  // editability signals, mirroring PROFILE_DIALOG_ANY_INPUT's role for the dialog.
  USER_PROFILE_PAGE_TABS: "section.user-profile:not(.blend-into-modal) .tabs-container",
  // The <h1> above the tabs, holding "<firstName> <lastName>" of the profile being viewed
  // (user-profile.vue .title-wrapper). It is the only place on the page that names the OWNER of the
  // profile, so it is what proves a deep link landed on the intended traveller rather than on the
  // viewer's own profile. Rendered only when hideProfileHeader is false — true for the embedded
  // profile dialog, false for the standalone /user/:userId page this selector targets.
  USER_PROFILE_PAGE_OWNER_NAME: ".user-profile-title .title-wrapper h1",
  // Birth Date is the one Personal Details control that renders WITHOUT `disabled` on a read-only
  // profile — personal-details-form.vue passes :disabled="disableEdit" to every other field but not
  // to its birth-date app-datepicker. The field is inert anyway (the picker does not open), so the
  // read-only check counts it separately instead of treating it as a privilege leak, and proves the
  // inertness by clicking it. If the binding is ever added, this simply counts zero.
  BIRTH_DATE_EDITABLE_INPUT: ".personal-details-form-content .birth-date-date-picker input:visible:not([disabled])",
};

class ProfilePage {
  constructor(page) {
    this.page = page;
  }

  // --- Navigation ---

  /** Clicks the header avatar to open the profile dropdown. */
  async openProfileMenu() {
    const trigger = this.page.locator(SELECTORS.PROFILE_MENU_TRIGGER).first();
    try {
      await trigger.waitFor({ state: 'visible', timeout: 15000 });
      await trigger.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.openProfileMenu] Could not open the header profile menu (selector: ${SELECTORS.PROFILE_MENU_TRIGGER}). ` +
        `The avatar may not be rendered yet, the user is not logged in, or the viewport is mobile — ` +
        `app-header.vue renders app-profile-menu only when "!isMobile". Original: ${err.message}`
      );
    }
  }

  /** Clicks "My profile" inside the open profile dropdown. Opens the profile in a new tab. */
  async clickMyProfile() {
    const item = this.page.locator(SELECTORS.MY_PROFILE_MENU_ITEM).first();
    try {
      await item.waitFor({ state: 'visible', timeout: 10000 });
      await item.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickMyProfile] Could not click "My profile" (selector: ${SELECTORS.MY_PROFILE_MENU_ITEM}). ` +
        `The profile dropdown may not have opened — it is revealed by CLICKING the avatar trigger, not hovering it. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the profile dropdown panel to be on screen after the trigger was clicked.
   *
   * Separate from openProfileMenu so a caller that asserts on the menu's CONTENTS can prove the
   * panel is genuinely open first — otherwise "Manage profiles is not visible" is indistinguishable
   * from "the menu never opened".
   */
  async waitForProfileMenuOpen(timeout = 10000) {
    const panel = this.page.locator(SELECTORS.PROFILE_MENU_CONTENT).first();
    try {
      await panel.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForProfileMenuOpen] The profile dropdown did not open (selector: ${SELECTORS.PROFILE_MENU_CONTENT}). ` +
        `el-tooltip teleports the panel into a .el-popper on click — the avatar trigger may not have been clicked, ` +
        `or a cookie-consent overlay swallowed the click. Original: ${err.message}`
      );
    }
  }

  /**
   * Locator for one option inside the OPEN profile dropdown, by the label the user reads.
   *
   * Scoped to the open panel on purpose — see SELECTORS.PROFILE_MENU_CONTENT.
   *
   * @param {string} optionName - "My profile" | "Manage profiles" | "Log out"
   */
  profileMenuOptionLocator(optionName) {
    const byLabel = {
      'My profile': SELECTORS.MY_PROFILE_MENU_ITEM,
      'Manage profiles': SELECTORS.MANAGE_PROFILES_MENU_ITEM,
      'Log out': MENU_SELECTORS.LOGOUT_ICON,
    };
    const selector = byLabel[optionName];
    if (!selector) {
      throw new Error(
        `[ProfilePage.profileMenuOptionLocator] Unknown profile menu option "${optionName}". ` +
        `app-profile-menu.vue renders only: ${Object.keys(byLabel).map((k) => `"${k}"`).join(', ')}.`
      );
    }
    return this.page.locator(SELECTORS.PROFILE_MENU_CONTENT).first().locator(selector);
  }

  /**
   * Whether an option is present in the open profile dropdown.
   *
   * The dropdown must already be open — call waitForProfileMenuOpen first. Returns false for an
   * option the user's privileges strip out (v-if, so the node is absent, not hidden).
   *
   * @param {string} optionName - "My profile" | "Manage profiles" | "Log out"
   */
  async isProfileMenuOptionVisible(optionName, timeout = 3000) {
    const option = this.profileMenuOptionLocator(optionName).first();
    try {
      await option.waitFor({ state: 'visible', timeout });
      return true;
    } catch (err) {
      // A privilege-gated entry is removed by v-if, so zero matches IS the expected negative.
      // Anything else the waitFor can reject with — a closed page or context, a broken selector —
      // is a real fault, and reporting it as "the option is not there" would turn it into a
      // passing absence assertion. Let those through instead.
      //
      // count() is itself guarded: on a closed page or context it throws too, and letting that
      // replace `err` would bury the original failure behind a less informative one.
      let matches;
      try {
        matches = await option.count();
      } catch {
        throw err;
      }

      if (matches === 0) {
        return false;
      }

      throw new Error(
        `[ProfilePage.isProfileMenuOptionVisible] "${optionName}" is present in the DOM but never became ` +
        `visible within ${timeout}ms, so its presence could not be decided. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks an option inside the ALREADY-OPEN profile dropdown.
   *
   * Deliberately does not click the avatar trigger first, unlike clickMyProfile's usual caller
   * Profile.navigateToProfile: el-tooltip's trigger="click" TOGGLES, so re-clicking it here would
   * shut the menu the assertion just inspected.
   *
   * @param {string} optionName - "My profile" | "Manage profiles" | "Log out"
   */
  async clickProfileMenuOption(optionName) {
    const option = this.profileMenuOptionLocator(optionName).first();
    try {
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickProfileMenuOption] Could not click "${optionName}" inside the open profile dropdown ` +
        `(panel: ${SELECTORS.PROFILE_MENU_CONTENT}). ` +
        `The dropdown may have closed, or the entry is not rendered for this user — "Manage profiles" in ` +
        `particular is gated on the "Can view profile of other users" privilege AND the manage-profiles ` +
        `feature flag (app-profile-menu.ts: canManageProfiles). Original: ${err.message}`
      );
    }
  }

  // --- Tabs ---

  async clickFrequentProgramsTab() {
    try {
      await this.page.locator(SELECTORS.FREQUENT_PROGRAMS_TAB).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickFrequentProgramsTab] Could not click Frequent Programs tab (selector: ${SELECTORS.FREQUENT_PROGRAMS_TAB}). ` +
        `The user profile page may not have loaded, or the tab is not visible. Original: ${err.message}`
      );
    }
  }

  async waitForFrequentProgramsForm() {
    try {
      await this.page.locator(SELECTORS.FREQUENT_PROGRAMS_FORM).waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForFrequentProgramsForm] Frequent Programs form did not appear (selector: ${SELECTORS.FREQUENT_PROGRAMS_FORM}). ` +
        `The tab may not have switched or the form failed to load. Original: ${err.message}`
      );
    }
  }

  // --- FQTV Entry Management ---

  async _findEntryByFqtvNumber(fqtvNumber) {
    // el-input doesn't set HTML value attribute — scan all entry rows for the input with matching value
    const rows = this.page.locator(SELECTORS.FREQUENT_PROGRAMS_INPUTS);
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const inputs = row.locator('input');
      const inputCount = await inputs.count();
      for (let j = 0; j < inputCount; j++) {
        const val = await inputs.nth(j).inputValue().catch(() => '');
        if (val === fqtvNumber) {
          return row;
        }
      }
    }
    return null;
  }

  async isFqtvEntryVisible(fqtvNumber) {
    const entry = await this._findEntryByFqtvNumber(fqtvNumber);
    return entry !== null;
  }

  async clickRemoveOnEntry(fqtvNumber) {
    try {
      const entry = await this._findEntryByFqtvNumber(fqtvNumber);
      if (!entry) {
        throw new Error(`No entry row found containing input with value "${fqtvNumber}"`);
      }
      await entry.locator(SELECTORS.REMOVE_ENTRY_BUTTON).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickRemoveOnEntry] Could not click remove button on FQTV entry "${fqtvNumber}". ` +
        `The entry may not exist or the delete icon is not visible. Original: ${err.message}`
      );
    }
  }

  async confirmDeleteDialog() {
    try {
      await this.page.locator(SELECTORS.CONFIRM_DELETE_BUTTON).waitFor({ state: 'visible', timeout: 10000 });
      await this.page.locator(SELECTORS.CONFIRM_DELETE_BUTTON).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.confirmDeleteDialog] Could not confirm the delete dialog. ` +
        `The dialog may not have appeared or the "Yes, Delete" button is not clickable. Original: ${err.message}`
      );
    }
  }

  async waitForEntryToDisappear(fqtvNumber) {
    try {
      // Poll until the entry is no longer found (max 15s)
      const startTime = Date.now();
      const timeout = 15000;
      while (Date.now() - startTime < timeout) {
        const entry = await this._findEntryByFqtvNumber(fqtvNumber);
        if (!entry) return;
        await this.page.waitForTimeout(500);
      }
      throw new Error(`Entry still present after ${timeout}ms`);
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForEntryToDisappear] FQTV entry "${fqtvNumber}" is still visible after deletion. ` +
        `The remove operation may not have completed. Original: ${err.message}`
      );
    }
  }

  // --- Add FQTV ---

  async clickAddFrequentFlyer() {
    try {
      await this.page.locator(SELECTORS.ADD_FREQUENT_FLYER_BUTTON).first().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickAddFrequentFlyer] Could not click "Add Frequent Flyer" button (selector: ${SELECTORS.ADD_FREQUENT_FLYER_BUTTON}). ` +
        `The Frequent Programs form may not be loaded. Original: ${err.message}`
      );
    }
  }

  async selectFirstAirlineFromDropdown() {
    try {
      const lastInputGroup = this.page.locator(SELECTORS.FREQUENT_PROGRAMS_INPUTS).last();
      await lastInputGroup.locator(SELECTORS.FF_CARRIER_DROPDOWN).click({ timeout: 10000 });
      await this.page.locator(SELECTORS.DROPDOWN_OPTION).first().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectFirstAirlineFromDropdown] Could not select the first airline from the carrier dropdown. ` +
        `The dropdown may not have opened or no options are available. Original: ${err.message}`
      );
    }
  }

  async fillFqtvNumber(fqtvNumber) {
    try {
      const lastInputGroup = this.page.locator(SELECTORS.FREQUENT_PROGRAMS_INPUTS).last();
      const numberInput = lastInputGroup.locator(SELECTORS.FF_NUMBER_INPUT);
      await numberInput.fill(fqtvNumber, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillFqtvNumber] Could not fill FQTV number "${fqtvNumber}" into the input field. ` +
        `The input may not be visible or editable. Original: ${err.message}`
      );
    }
  }

  async clickSaveFrequentPrograms() {
    try {
      await this.page.locator(SELECTORS.SAVE_BUTTON).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickSaveFrequentPrograms] Could not click the Save button (selector: ${SELECTORS.SAVE_BUTTON}). ` +
        `The form may not be in a valid state or the button is disabled. Original: ${err.message}`
      );
    }
  }

  // --- BahnCard (DB rail) programs ---

  _lastBahnCardRow() {
    return this.page.locator(SELECTORS.BAHNCARD_ROW).last();
  }

  async getBahnCardRowCount() {
    return this.page.locator(SELECTORS.BAHNCARD_ROW).count();
  }

  async clickAddBahnCardProgram() {
    try {
      const before = await this.getBahnCardRowCount();
      await this.page.locator(SELECTORS.BAHNCARD_ADD_BUTTON).click({ timeout: 10000 });
      // The row is pushed into formData synchronously, but Vue renders it on the next tick —
      // wait for the row count to grow so the callers' `.last()` lookups hit the new row.
      await expect
        .poll(async () => this.getBahnCardRowCount(), { timeout: 10000 })
        .toBeGreaterThan(before);
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickAddBahnCardProgram] Could not add a BahnCard loyalty row (selector: ${SELECTORS.BAHNCARD_ADD_BUTTON}). ` +
        `The Frequent Programs form may not be loaded, or the corporation is not configured for Deutsche Bahn. Original: ${err.message}`
      );
    }
  }

  async selectBahnCardType(cardType) {
    try {
      const row = this._lastBahnCardRow();
      await row.locator(SELECTORS.BAHNCARD_TYPE_SELECT).click({ timeout: 10000 });

      // Scope to the open popper: every closed el-select keeps its dropdown in the DOM.
      const option = this.page
        .locator(`.el-select-dropdown:visible ${SELECTORS.DROPDOWN_OPTION}`)
        .filter({ hasText: cardType })
        .first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectBahnCardType] Could not select BahnCard type "${cardType}". ` +
        `The dropdown may not have opened or the option is not one of the DbRailCardTypes. Original: ${err.message}`
      );
    }
  }

  async getBahnCardTypeText() {
    const row = this._lastBahnCardRow();
    return (await row.locator(SELECTORS.BAHNCARD_TYPE_SELECT).innerText()).trim();
  }

  async fillBahnCardNumber(programNumber) {
    try {
      const input = this._lastBahnCardRow().locator(SELECTORS.BAHNCARD_NUMBER_INPUT);
      await input.waitFor({ state: 'visible', timeout: 10000 });
      await input.fill(programNumber, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillBahnCardNumber] Could not fill BahnCard number "${programNumber}" ` +
        `(selector: ${SELECTORS.BAHNCARD_NUMBER_INPUT}). Original: ${err.message}`
      );
    }
  }

  async getBahnCardNumberValue() {
    return this._lastBahnCardRow().locator(SELECTORS.BAHNCARD_NUMBER_INPUT).inputValue();
  }

  async getBahnCardValidUntilValue() {
    return this._lastBahnCardRow().locator(SELECTORS.BAHNCARD_VALID_UNTIL_INPUT).inputValue();
  }

  /**
   * Types into the "Valid until" picker (app-datepicker is rendered with `editable`).
   *
   * The typed text is committed by BLURRING, never by pressing Enter: every `.add-loyalty-btn`
   * in frequent-programs-form.vue is an app-btn, which renders a plain `<button>` inside the
   * form, so Enter in any input triggers implicit form submission and activates the FIRST such
   * button — "Add Frequent Flyer". That silently appends an empty Frequent Flyer row whose
   * `required` number then makes vuelidate reject the whole form, and handleSubmit returns
   * without ever sending the save request.
   *
   * Does NOT assert the value took — the picker only accepts text in its own display format,
   * which localizePickerDateFormat() rewrites to "MMM DD, YYYY" under the en-US locale.
   * Callers must read the value back and fall back to the calendar when it did not parse.
   */
  async typeBahnCardValidUntil(dateText) {
    try {
      const input = this._lastBahnCardRow().locator(SELECTORS.BAHNCARD_VALID_UNTIL_INPUT);
      await input.waitFor({ state: 'visible', timeout: 10000 });
      await input.click({ timeout: 10000 });
      await input.fill(dateText, { timeout: 10000 });
      await input.evaluate((el) => el.blur());
      await this.closeDatePickerPanel();
    } catch (err) {
      throw new Error(
        `[ProfilePage.typeBahnCardValidUntil] Could not type "${dateText}" into the BahnCard "Valid until" picker ` +
        `(selector: ${SELECTORS.BAHNCARD_VALID_UNTIL_INPUT}). Original: ${err.message}`
      );
    }
  }

  async openBahnCardValidUntilPicker() {
    try {
      const input = this._lastBahnCardRow().locator(SELECTORS.BAHNCARD_VALID_UNTIL_INPUT);
      await input.waitFor({ state: 'visible', timeout: 10000 });
      await input.click({ timeout: 10000 });
      await this.page.locator(SELECTORS.DATE_PICKER_PANEL).last().waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.openBahnCardValidUntilPicker] Could not open the BahnCard "Valid until" date picker. ` +
        `The BahnCard row may not have been added. Original: ${err.message}`
      );
    }
  }

  /**
   * Dismisses an open picker popper so it stops overlaying the form's Save button.
   */
  async closeDatePickerPanel() {
    const panel = this.page.locator(SELECTORS.DATE_PICKER_PANEL);
    if (await panel.count() === 0) {
      return;
    }
    await this.page.keyboard.press('Escape');
    await panel.last().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  async clickRemoveOnBahnCardRow() {
    try {
      await this._lastBahnCardRow().locator(SELECTORS.REMOVE_ENTRY_BUTTON).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickRemoveOnBahnCardRow] Could not click the delete icon on the BahnCard row ` +
        `(selector: ${SELECTORS.BAHNCARD_ROW} ${SELECTORS.REMOVE_ENTRY_BUTTON}). Original: ${err.message}`
      );
    }
  }

  async waitForBahnCardRowCount(expectedCount, timeout = 15000) {
    try {
      await expect.poll(async () => this.getBahnCardRowCount(), { timeout }).toBe(expectedCount);
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForBahnCardRowCount] Expected ${expectedCount} BahnCard row(s) but the count never settled there. ` +
        `The add/remove operation may not have completed. Original: ${err.message}`
      );
    }
  }

  /**
   * Validation messages currently rendered anywhere in the Frequent Programs form.
   * The form's handleSubmit() bails out silently when vuelidate reports the form invalid, so
   * these are the only on-screen explanation for a Save that produced no request.
   */
  async getFrequentProgramsValidationMessages() {
    const messages = this.page.locator(SELECTORS.FREQUENT_PROGRAMS_VALIDATION_MSG);
    return (await messages.allTextContents()).map((text) => text.trim()).filter(Boolean);
  }

  async getAllLoyaltyInputValues() {
    try {
      // Loyalty entries span 3 sections (flights, hotel, car/rail), each using different row classes.
      // Querying all el-input fields within the form covers every section in one pass.
      const inputs = this.page.locator(`${SELECTORS.FREQUENT_PROGRAMS_FORM} ${SELECTORS.FF_NUMBER_INPUT}`);
      const count = await inputs.count();
      const values = [];
      for (let i = 0; i < count; i++) {
        const val = await inputs.nth(i).inputValue().catch(() => '');
        if (val) values.push(val);
      }
      return values;
    } catch (err) {
      throw new Error(
        `[ProfilePage.getAllLoyaltyInputValues] Could not collect loyalty number input values ` +
        `(selector: ${SELECTORS.FREQUENT_PROGRAMS_FORM} ${SELECTORS.FF_NUMBER_INPUT}). ` +
        `Ensure the Frequent Programs tab is open. Original: ${err.message}`
      );
    }
  }

  // --- Personal Details — Dynamic Reference Fields ---

  async getDynamicFieldWarningCount() {
    try {
      return await this.page.locator(SELECTORS.DYNAMIC_FIELD_WARNING).count();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getDynamicFieldWarningCount] Failed to count dynamic field warning messages ` +
        `(selector: ${SELECTORS.DYNAMIC_FIELD_WARNING}). Original: ${err.message}`
      );
    }
  }

  async getDynamicFieldSelectValue() {
    try {
      const locator = this.page.locator(SELECTORS.DYNAMIC_FIELD_SELECT_VALUE).first();
      await locator.waitFor({ state: 'visible', timeout: 10000 });
      return await locator.textContent();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getDynamicFieldSelectValue] Failed to read the selected value from the dynamic field dropdown ` +
        `(selector: ${SELECTORS.DYNAMIC_FIELD_SELECT_VALUE}). ` +
        `The field may not be rendered or the reference-fields-container is missing. Original: ${err.message}`
      );
    }
  }

  /**
   * Determines whether the dynamic reference field in the profile is editable.
   * A field configured as "Editable = Nowhere" renders as a disabled el-select
   * (the Vue template binds :disabled="!isEditable" and sets a title when not editable),
   * so it only displays its option value and cannot be changed.
   * Mirrors the disabled-detection in DynamicAndReferenceFieldsPage.isFieldDisabled.
   * @returns {Promise<boolean>} True if the dynamic field is editable (enabled).
   */
  async isDynamicFieldEditable() {
    const container = this.page.locator(SELECTORS.DYNAMIC_FIELD_CONTAINER).first();
    try {
      await container.waitFor({ state: 'visible', timeout: 10000 });
      await container.scrollIntoViewIfNeeded();
    } catch (err) {
      throw new Error(
        `[ProfilePage.isDynamicFieldEditable] The dynamic reference fields section did not appear ` +
        `(selector: ${SELECTORS.DYNAMIC_FIELD_CONTAINER}). Ensure the Personal Details tab is open and the ` +
        `logged-in user has a dynamic profile field configured. Original: ${err.message}`
      );
    }

    // Scope to the field's OWN el-select rather than the whole container, so a second, editable field
    // in the section can't mask a disabled one (or vice-versa). The step asserts a single field.
    const select = container.locator('.el-select').first();
    try {
      await select.waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.isDynamicFieldEditable] No dynamic reference field dropdown (.el-select) rendered inside ` +
        `${SELECTORS.DYNAMIC_FIELD_CONTAINER}. The field may not be a dropdown or the section is empty. Original: ${err.message}`
      );
    }

    // Element Plus puts `is-disabled` on the el-select ROOT itself (a self class)...
    const rootClass = (await select.getAttribute('class')) || '';
    if (/\bis-disabled\b/.test(rootClass)) return false;
    // ...and mirrors the disabled state on inner nodes (wrapper is-disabled/aria-disabled, input is-disabled).
    if ((await select.locator(EL_SELECT_DISABLED_INNER).count()) > 0) return false;

    // Fallback: the Vue template sets a non-empty title on the select when !isEditable.
    const title = await select.getAttribute('title');
    if (title && title.length > 0) return false;

    return true;
  }

  async clickPersonalDetailsTab() {
    try {
      const tab = this.page.locator(SELECTORS.PERSONAL_DETAILS_TAB);
      await tab.waitFor({ state: 'attached', timeout: 10000 });
      await tab.dispatchEvent('click');
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickPersonalDetailsTab] Could not click Personal Details tab ` +
        `(selector: ${SELECTORS.PERSONAL_DETAILS_TAB}). The profile page may not have loaded or the tab is not rendered. ` +
        `Original: ${err.message}`
      );
    }
  }

  async scrollToDynamicFieldLabel() {
    try {
      const label = this.page.locator(SELECTORS.DYNAMIC_FIELD_LABEL).first();
      await label.waitFor({ state: 'visible', timeout: 10000 });
      await label.scrollIntoViewIfNeeded();
    } catch (err) {
      throw new Error(
        `[ProfilePage.scrollToDynamicFieldLabel] Could not scroll to the dynamic reference field label ` +
        `(selector: ${SELECTORS.DYNAMIC_FIELD_LABEL}). The reference-fields-container may not be present on this profile. ` +
        `Original: ${err.message}`
      );
    }
  }

  async hoverDynamicFieldInfoIcon() {
    try {
      const icon = this.page.locator(SELECTORS.DYNAMIC_FIELD_INFO_ICON).first();
      await icon.waitFor({ state: 'visible', timeout: 10000 });
      await icon.hover();
    } catch (err) {
      throw new Error(
        `[ProfilePage.hoverDynamicFieldInfoIcon] Could not hover over the dynamic field info icon ` +
        `(selector: ${SELECTORS.DYNAMIC_FIELD_INFO_ICON}). The icon may not exist for this field or the field is not in view. ` +
        `Original: ${err.message}`
      );
    }
  }

  async getDynamicFieldTooltipText() {
    try {
      const tooltip = this.page.locator(SELECTORS.DYNAMIC_FIELD_TOOLTIP).first();
      await tooltip.waitFor({ state: 'attached', timeout: 10000 });
      return await tooltip.textContent();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getDynamicFieldTooltipText] Could not read tooltip text ` +
        `(selector: ${SELECTORS.DYNAMIC_FIELD_TOOLTIP}). The tooltip may not have appeared after hover — ` +
        `ensure the info icon was hovered and the helpQuestionText is populated for this field. ` +
        `Original: ${err.message}`
      );
    }
  }

  // --- Travel Preferences Tab ---

  async clickTravelPreferencesTab() {
    try {
      const tab = this.page.locator(SELECTORS.TRAVEL_PREFERENCES_TAB);
      await tab.waitFor({ state: 'attached', timeout: 10000 });
      await tab.dispatchEvent('click');
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickTravelPreferencesTab] Could not click Travel Preferences tab (selector: ${SELECTORS.TRAVEL_PREFERENCES_TAB}). ` +
        `The profile page may not have loaded or the tab is hidden behind overflow. Original: ${err.message}`
      );
    }
  }

  async waitForTravelPreferencesForm() {
    try {
      await this.page.locator(SELECTORS.TRAVEL_PREFERENCES_FORM).waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForTravelPreferencesForm] Travel Preferences form did not appear (selector: ${SELECTORS.TRAVEL_PREFERENCES_FORM}). ` +
        `The tab may not have switched or the form failed to load. Original: ${err.message}`
      );
    }
  }

  async clickSeatPreferenceDropdown() {
    try {
      const seatField = this.page.locator(SELECTORS.TRAVEL_PREFERENCES_FORM)
        .locator('.field.app-column')
        .filter({ has: this.page.locator(`label.label:text-is("${SELECTORS.SEAT_TYPE_LABEL}")`) });
      const select = seatField.locator('.el-select');
      await select.waitFor({ state: 'visible', timeout: 10000 });
      await select.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickSeatPreferenceDropdown] Could not click the Seat type dropdown (label: "${SELECTORS.SEAT_TYPE_LABEL}"). ` +
        `The travel preferences form may not be loaded or the field is disabled. Original: ${err.message}`
      );
    }
  }

  async selectSeatPreferenceOption(optionText) {
    try {
      const option = this.page.locator(SELECTORS.DROPDOWN_OPTION).filter({ hasText: optionText });
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectSeatPreferenceOption] Could not select seat preference option "${optionText}" from dropdown. ` +
        `The dropdown may not have opened or the option does not exist. Original: ${err.message}`
      );
    }
  }

  async getSeatPreferenceText() {
    try {
      const seatField = this.page.locator(SELECTORS.TRAVEL_PREFERENCES_FORM)
        .locator('.field.app-column')
        .filter({ has: this.page.locator(`label.label:text-is("${SELECTORS.SEAT_TYPE_LABEL}")`) });
      const placeholder = seatField.locator('.el-select__placeholder span');
      await placeholder.waitFor({ state: 'attached', timeout: 10000 });
      const text = await placeholder.textContent();
      return text ? text.trim() : '';
    } catch (err) {
      throw new Error(
        `[ProfilePage.getSeatPreferenceText] Could not read seat preference value (label: "${SELECTORS.SEAT_TYPE_LABEL}"). ` +
        `The travel preferences form may not be loaded. Original: ${err.message}`
      );
    }
  }

  async clickSaveTravelPreferences() {
    try {
      const saveBtn = this.page.locator(SELECTORS.SAVE_TRAVEL_PREFERENCES_BUTTON).first();
      await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
      await saveBtn.click({ timeout: 10000 });
      await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickSaveTravelPreferences] Could not click the Save Travel Preferences button (selector: ${SELECTORS.SAVE_TRAVEL_PREFERENCES_BUTTON}). ` +
        `The button may be hidden, disabled, or the form did not load. Original: ${err.message}`
      );
    }
  }

  // --- Contact Information Tab ---

  async clickContactInformationTab() {
    try {
      const tab = this.page.locator(SELECTORS.CONTACT_INFORMATION_TAB);
      await tab.waitFor({ state: 'attached', timeout: 10000 });
      await tab.dispatchEvent('click');
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickContactInformationTab] Could not click Contact Information tab (selector: ${SELECTORS.CONTACT_INFORMATION_TAB}). ` +
        `The profile page may not have loaded or the tab is hidden behind overflow. Original: ${err.message}`
      );
    }
  }

  async waitForContactInfoForm() {
    try {
      await this.page.locator(SELECTORS.CONTACT_INFO_FORM).waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForContactInfoForm] Contact Information form did not appear (selector: ${SELECTORS.CONTACT_INFO_FORM}). ` +
        `The tab may not have switched or the form failed to load. Original: ${err.message}`
      );
    }
  }

  async getCityInputValue() {
    try {
      // Locate the Business address city field by finding the .field container
      // with a label containing "City" text under the Business address section
      const cityField = this.page.locator(SELECTORS.CONTACT_INFO_FORM)
        .locator('.field.app-column', { has: this.page.locator('label', { hasText: 'City' }) })
        .first()
        .locator('input');
      await cityField.waitFor({ state: 'visible', timeout: 10000 });
      return await cityField.inputValue();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getCityInputValue] Could not read city input value. ` +
        `The contact information form may not be loaded or the city field is not visible. Original: ${err.message}`
      );
    }
  }

  async clickSaveContactInfo() {
    try {
      const saveBtn = this.page.locator(SELECTORS.SAVE_CONTACT_INFO_BUTTON).first();
      await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
      await saveBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickSaveContactInfo] Could not click the Save Contact Information button (selector: ${SELECTORS.SAVE_CONTACT_INFO_BUTTON}). ` +
        `The button may be hidden, disabled, or the form did not load. Original: ${err.message}`
      );
    }
  }

  async getBusinessPhoneValues() {
    try {
      const dialEl = this.page.locator(SELECTORS.BUSINESS_PHONE_DIAL);
      await dialEl.waitFor({ state: 'visible', timeout: 10000 });
      const dialText = await dialEl.textContent();
      const countryCode = (dialText || '').replace(/^\+/, '').trim();
      const areaCode = await this.page.locator(SELECTORS.BUSINESS_PHONE_AREA).inputValue();
      const number = await this.page.locator(SELECTORS.BUSINESS_PHONE_NUMBER).inputValue();
      return { countryCode, areaCode, number };
    } catch (err) {
      throw new Error(
        `[ProfilePage.getBusinessPhoneValues] Could not read business phone values. ` +
        `The Contact Information form may not be loaded or phone fields are not rendered. Original: ${err.message}`
      );
    }
  }

  async getStateFieldValue() {
    try {
      await this.page.locator(SELECTORS.STATE_LABEL).waitFor({ state: 'visible', timeout: 10000 });
      const value = await this.page.locator(SELECTORS.STATE_VALUE).textContent();
      return value ? value.trim() : '';
    } catch (err) {
      throw new Error(
        `[ProfilePage.getStateFieldValue] Could not read state field value (label: ${SELECTORS.STATE_LABEL}, value: ${SELECTORS.STATE_VALUE}). ` +
        `The "State" dropdown may not be visible — this field only appears for countries that have states. Original: ${err.message}`
      );
    }
  }

  // --- Permissions Tab ---

  async clickPermissionsTab() {
    try {
      const tab = this.page.locator(SELECTORS.PERMISSIONS_TAB);
      await tab.waitFor({ state: 'attached', timeout: 10000 });
      await tab.dispatchEvent('click');
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickPermissionsTab] Could not click Permissions tab (selector: ${SELECTORS.PERMISSIONS_TAB}). ` +
        `The tab may not be visible — it only appears for users with the CanUseTravelArrangerAssignment permission. Original: ${err.message}`
      );
    }
  }

  async clickPermissionsSection(sectionName) {
    try {
      const section = this.page.locator(SELECTORS.PERMISSIONS_SECTION_TAB);
      await section.waitFor({ state: 'attached', timeout: 15000 });
      await section.dispatchEvent('click');
      // Wait for the section content to render after tab switch
      await this.page.locator(SELECTORS.PERMISSIONS_USER_SELECT).waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickPermissionsSection] Could not click section "${sectionName}" (selector: ${SELECTORS.PERMISSIONS_SECTION_TAB}). ` +
        `The inner tab may be hidden behind CSS overflow or the content failed to load. Original: ${err.message}`
      );
    }
  }

  async clickTrashIconOnFirstArranger() {
    try {
      const trashIcon = this.page.locator(SELECTORS.PERMISSIONS_TRASH_ICON).first();
      await trashIcon.waitFor({ state: 'visible', timeout: 10000 });
      await trashIcon.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickTrashIconOnFirstArranger] Could not click trash icon on first arranger row (selector: ${SELECTORS.PERMISSIONS_TRASH_ICON}). ` +
        `There may be no users in the table or the trash icon is not rendered. Original: ${err.message}`
      );
    }
  }

  async confirmRemoveUser() {
    try {
      const confirmBtn = this.page.locator(SELECTORS.CONFIRM_DELETE_BUTTON);
      await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
      await confirmBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.confirmRemoveUser] Could not click confirm button in remove dialog (selector: ${SELECTORS.CONFIRM_DELETE_BUTTON}). ` +
        `The confirm dialog may not have appeared. Original: ${err.message}`
      );
    }
  }

  async isArrangerTableEmpty() {
    const noArrangers = this.page.locator(SELECTORS.PERMISSIONS_NO_ARRANGERS);
    const rows = this.page.locator(SELECTORS.PERMISSIONS_ARRANGER_ROW);
    const noArrangersVisible = await noArrangers.isVisible().catch(() => false);
    if (noArrangersVisible) return true;
    const rowCount = await rows.count();
    return rowCount === 0;
  }

  async fillTravelArrangerSearch(name) {
    try {
      const select = this.page.locator(SELECTORS.PERMISSIONS_USER_SELECT);
      await select.click({ timeout: 10000 });
      const input = this.page.locator(SELECTORS.TRAVEL_ARRANGER_INPUT);
      await input.waitFor({ state: 'visible', timeout: 10000 });
      await input.fill(name, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillTravelArrangerSearch] Could not fill travel arranger search with "${name}" (selector: ${SELECTORS.TRAVEL_ARRANGER_INPUT}). ` +
        `The select may not have opened or input is not visible. Original: ${err.message}`
      );
    }
  }

  async selectTravelArrangerFromDropdown() {
    try {
      const option = this.page.locator(SELECTORS.TRAVEL_ARRANGER_DROPDOWN_OPTION);
      await option.first().waitFor({ state: 'visible', timeout: 10000 });
      await option.first().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectTravelArrangerFromDropdown] Could not select option from travel arranger dropdown (selector: ${SELECTORS.TRAVEL_ARRANGER_DROPDOWN_OPTION}). ` +
        `No results may have appeared for the search query. Original: ${err.message}`
      );
    }
  }

  async getTravelArrangerSelectedText() {
    try {
      const selected = this.page.locator(SELECTORS.TRAVEL_ARRANGER_SELECTED);
      await selected.waitFor({ state: 'visible', timeout: 10000 });
      const text = await selected.textContent();
      return text ? text.trim() : '';
    } catch (err) {
      throw new Error(
        `[ProfilePage.getTravelArrangerSelectedText] Could not read selected travel arranger text (selector: ${SELECTORS.TRAVEL_ARRANGER_SELECTED}). ` +
        `No travel arranger may have been selected yet. Original: ${err.message}`
      );
    }
  }

  // --- Traveler Profile (from trip page) ---

  async clickTravelerNameLink(travelerName) {
    try {
      const link = this.page.locator(SELECTORS.TRAVELER_NAME_LINK).filter({ hasText: travelerName });
      await link.waitFor({ state: 'visible', timeout: 15000 });
      await link.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickTravelerNameLink] Could not click traveler name link "${travelerName}" (selector: ${SELECTORS.TRAVELER_NAME_LINK}). ` +
        `The traveler may not have been added to the trip or the name didn't load. Original: ${err.message}`
      );
    }
  }

  async clickFirstTravelerNameLink() {
    try {
      const link = this.page.locator(SELECTORS.TRAVELER_NAME_LINK).first();
      await link.waitFor({ state: 'visible', timeout: 15000 });
      await link.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickFirstTravelerNameLink] Could not click first traveler name link (selector: ${SELECTORS.TRAVELER_NAME_LINK}). ` +
        `No traveler may have been added to the trip. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the LAST filled, viewable traveler name on the trip/search page.
   *
   * Deliberately a sibling of clickFirstTravelerNameLink rather than a parameter on it: the first
   * tag is the primary traveller (usually the logged-in booker), so a scenario that adds a second
   * traveller and then opens THAT traveller's profile has to target the last tag. Uses
   * FILLED_TRAVELER_NAME_LINK, not TRAVELER_NAME_LINK — a leftover empty "Select Traveller" slot
   * renders after the filled tags and would otherwise win `.last()`. Only travellers the logged-in
   * user may view carry `is-clickable` (trip-traveler-tag.vue binds it to isUserCanViewProfile),
   * so the locator also excludes tags that cannot be opened at all.
   */
  async clickLastTravelerNameLink() {
    try {
      const link = this.page.locator(SELECTORS.FILLED_TRAVELER_NAME_LINK).last();
      await link.waitFor({ state: 'visible', timeout: 15000 });
      await link.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickLastTravelerNameLink] Could not click the last filled traveler name link ` +
        `(selector: ${SELECTORS.FILLED_TRAVELER_NAME_LINK}). Either no traveller is on the trip (only ` +
        `empty "Select Traveller" slots), or the logged-in user lacks the privilege to view that ` +
        `traveller's profile — without it trip-traveler-tag.vue omits the is-clickable class this ` +
        `selector requires. Original: ${err.message}`
      );
    }
  }

  /**
   * Names currently rendered as filled, viewable traveler tags. Lets the DSL name the tags it could
   * choose from in a failure message instead of leaving a bare timeout.
   * @returns {Promise<string[]>}
   */
  async getFilledTravelerNameLinkTexts() {
    const texts = await this.page.locator(SELECTORS.FILLED_TRAVELER_NAME_LINK).allTextContents();
    return texts.map((text) => text.trim()).filter(Boolean);
  }

  /**
   * Waits for the standalone traveler profile page (the /user/:userId route) to finish rendering.
   * The dialog counterpart is waitForDialogByTitle — kept separate because this page has no
   * .app-dialog wrapper at all.
   * @param {number} [timeoutMs=25000]
   */
  async waitForUserProfilePage(timeoutMs = 25000) {
    try {
      await this.page.locator(SELECTORS.USER_PROFILE_PAGE).first().waitFor({ state: 'visible', timeout: timeoutMs });
      await this.page.locator(SELECTORS.USER_PROFILE_PAGE_TABS).first().waitFor({ state: 'visible', timeout: timeoutMs });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForUserProfilePage] The standalone traveler profile page did not render within ` +
        `${timeoutMs}ms (selectors: "${SELECTORS.USER_PROFILE_PAGE}", "${SELECTORS.USER_PROFILE_PAGE_TABS}"). ` +
        `The new tab may still be loading, the /user/:userId route may have redirected, or the profile ` +
        `request may have failed. Original: ${err.message}`
      );
    }
  }

  /**
   * Editability signals for the standalone profile page: whether the app's own read-only class is
   * present, plus the visible-Save and enabled-input counts. Page Objects never assert — the DSL
   * decides what the combination means.
   *
   * `editableBirthDateInputs` is reported separately so the DSL can discount the known-inert Birth
   * Date field (see BIRTH_DATE_EDITABLE_INPUT) without discounting any other enabled control. Use
   * describeEditableInputs() to name the offending controls when the assertion fails.
   * @param {number} [timeoutMs=20000]
   * @returns {Promise<{ readOnlyClass: boolean, saveButtons: number, editableInputs: number, editableBirthDateInputs: number }>}
   */
  async getUserProfilePageEditability(timeoutMs = 20000) {
    const profileSection = this.page.locator(SELECTORS.USER_PROFILE_PAGE).first();
    await profileSection.waitFor({ state: 'visible', timeout: timeoutMs });
    // Same race as getDialogEditability: wait for a form input to mount, otherwise both counts
    // below read zero and a perfectly editable profile looks read-only.
    try {
      await profileSection.locator(SELECTORS.PROFILE_DIALOG_ANY_INPUT).first().waitFor({ state: 'visible', timeout: timeoutMs });
    } catch {
      // Deliberately swallowed: the counts returned below describe the failure to the DSL.
    }

    const readOnlyClass = (await this.page.locator(SELECTORS.USER_PROFILE_PAGE_READ_ONLY).count()) > 0;
    const saveButtons = await profileSection.locator(SELECTORS.PROFILE_DIALOG_SAVE_BTN + ':visible').count();
    const editableInputs = await profileSection.locator(SELECTORS.PROFILE_DIALOG_EDITABLE_INPUT).count();
    const editableBirthDateInputs = await profileSection.locator(SELECTORS.BIRTH_DATE_EDITABLE_INPUT).count();

    return { readOnlyClass, saveButtons, editableInputs, editableBirthDateInputs };
  }

  /**
   * Identifies the enabled inputs on the open profile page (type/name/placeholder/class, first 5).
   * Kept out of getUserProfilePageEditability on purpose: these attribute reads only matter when a
   * read-only assertion is about to fail, so the passing path should not pay for them.
   * @param {number} [maxInputs=5]
   * @returns {Promise<string[]>}
   */
  async describeEditableInputs(maxInputs = 5) {
    if (typeof maxInputs !== 'number' || maxInputs < 1) {
      throw new Error(
        `[ProfilePage.describeEditableInputs] "maxInputs" must be a number >= 1, got: ${typeof maxInputs} (${maxInputs}).`
      );
    }

    const editableInputLocator = this.page
      .locator(SELECTORS.USER_PROFILE_PAGE)
      .first()
      .locator(SELECTORS.PROFILE_DIALOG_EDITABLE_INPUT);
    const count = Math.min(await editableInputLocator.count(), maxInputs);
    const details = [];

    for (let index = 0; index < count; index++) {
      const input = editableInputLocator.nth(index);
      const [type, name, placeholder, className] = await Promise.all([
        input.getAttribute('type'),
        input.getAttribute('name'),
        input.getAttribute('placeholder'),
        input.getAttribute('class'),
      ]);
      details.push(
        `type=${type ?? 'none'} name=${name ?? 'none'} placeholder=${placeholder ?? 'none'} class=${className ?? 'none'}`
      );
    }

    return details;
  }

  /**
   * Whether the Birth Date input can actually receive a click. Uses a trial click, so Playwright
   * runs every actionability check (visible, stable, enabled, receives pointer events) WITHOUT
   * interacting — the field is left untouched either way.
   *
   * On a read-only profile the .personal-details-form section swallows pointer events, so the
   * undisabled Birth Date input reports as non-interactive. Page Objects report state; the DSL
   * decides what it means.
   * @param {number} [timeoutMs=3000] - Short on purpose: the caller expects the check to fail.
   * @returns {Promise<boolean>}
   */
  async isDateOfBirthInputInteractive(timeoutMs = 3000) {
    const input = this.page.locator(SELECTORS.DOB_INPUT).first();

    try {
      await input.waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.isDateOfBirthInputInteractive] The Birth Date input never rendered (selector: ${SELECTORS.DOB_INPUT}). ` +
        `Personal Details may not be the active tab, or the profile may still be loading — without the field ` +
        `present, its interactivity cannot be judged either way. Original: ${err.message}`
      );
    }

    try {
      await input.click({ trial: true, timeout: timeoutMs });
      return true;
    } catch {
      // Deliberately swallowed: a failed trial click IS the answer (the field cannot receive
      // clicks). The field's visibility was already asserted above, so this cannot mask a
      // missing-element problem; the DSL asserts on the boolean.
      return false;
    }
  }

  async waitForPersonalDetailsForm() {
    try {
      await this.page.locator(SELECTORS.PERSONAL_DETAILS_FORM).waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForPersonalDetailsForm] Personal details form did not appear (selector: ${SELECTORS.PERSONAL_DETAILS_FORM}). ` +
        `The traveler profile may not have opened or is still loading. Original: ${err.message}`
      );
    }
  }

  async getTitleFieldLabel() {
    try {
      const label = this.page.locator(SELECTORS.TITLE_FIELD_LABEL).first();
      await label.waitFor({ state: 'visible', timeout: 10000 });
      return (await label.textContent() ?? '').trim();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getTitleFieldLabel] Could not read the Title field label ` +
        `(selector: ${SELECTORS.TITLE_FIELD_LABEL}). The Personal Details form may not be loaded ` +
        `or the name-inputs-container is not rendered. Original: ${err.message}`
      );
    }
  }

  /**
   * Resolves the Time format radio group's .field.app-column inside the Personal Details form.
   * Scoped by its label because the First day group next to it is structurally identical.
   */
  _timeFormatField() {
    return this.page.locator(SELECTORS.PERSONAL_DETAILS_FORM)
      .locator('.field.app-column')
      .filter({ has: this.page.locator(`label.label:text-is("${SELECTORS.TIME_FORMAT_LABEL}")`) });
  }

  /**
   * Resolves one Time format option by its rendered label, e.g. "12 Hours" / "24 Hours".
   * @param {string} optionLabel
   */
  _timeFormatOption(optionLabel) {
    return this._timeFormatField()
      .locator(`.el-radio:has(.el-radio__label:text-is("${optionLabel}"))`);
  }

  /**
   * Selects a Time format option on the Personal Details form.
   *
   * Clicks .el-radio__inner rather than the label: Element Plus paints the selected state on that
   * inner span, and it is the only part of the control that is not covered by the label text node.
   *
   * @param {string} optionLabel - The option as rendered, e.g. "12 Hours"
   */
  async clickTimeFormatOption(optionLabel) {
    try {
      await this.waitForPersonalDetailsForm();
      const radio = this._timeFormatOption(optionLabel);
      await radio.waitFor({ state: 'visible', timeout: 10000 });
      await radio.locator('.el-radio__inner').click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickTimeFormatOption] Could not select the "${optionLabel}" Time format option ` +
        `(field label: "${SELECTORS.TIME_FORMAT_LABEL}"). The Personal Details form may not be loaded, ` +
        `the radio group may be disabled for this user, or no option carries that label. Original: ${err.message}`
      );
    }
  }

  /**
   * Whether a Time format option is currently the selected one.
   *
   * Element Plus marks the chosen radio with `is-checked` on the el-radio root, so this reads the
   * state the form will actually submit — not merely that the click landed somewhere.
   *
   * @param {string} optionLabel - The option as rendered, e.g. "12 Hours"
   * @returns {Promise<boolean>}
   */
  async isTimeFormatOptionChecked(optionLabel) {
    try {
      const radio = this._timeFormatOption(optionLabel).first();
      await radio.waitFor({ state: 'visible', timeout: 10000 });
      const className = (await radio.getAttribute('class')) ?? '';
      return className.split(/\s+/).includes('is-checked');
    } catch (err) {
      throw new Error(
        `[ProfilePage.isTimeFormatOptionChecked] Could not read the "${optionLabel}" Time format option ` +
        `(field label: "${SELECTORS.TIME_FORMAT_LABEL}"). The Personal Details form may not be loaded ` +
        `or no option carries that label. Original: ${err.message}`
      );
    }
  }
  async clickSavePersonalDetails() {
    try {
      const saveBtn = this.page.locator(SELECTORS.SAVE_PERSONAL_DETAILS_BUTTON).first();
      await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
      await saveBtn.click({ timeout: 10000 });
      await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickSavePersonalDetails] Could not click the Save Personal Details button (selector: ${SELECTORS.SAVE_PERSONAL_DETAILS_BUTTON}). ` +
        `The button may be hidden, disabled, or the form did not load. Original: ${err.message}`
      );
    }
  }

  async clickBackupApproverDropdown() {
    try {
      const field = this.page.locator(SELECTORS.PERSONAL_DETAILS_FORM)
        .locator('.field.app-column')
        .filter({ has: this.page.locator(`label.label:text-is("${SELECTORS.BACKUP_APPROVER_LABEL}")`) });
      const select = field.locator('.el-select');
      await select.waitFor({ state: 'visible', timeout: 10000 });
      await select.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickBackupApproverDropdown] Could not click the backup approver dropdown. ` +
        `The personal details form may not be loaded or the field is disabled. Original: ${err.message}`
      );
    }
  }

  async fillBackupApproverSearch(term) {
    try {
      const field = this.page.locator(SELECTORS.PERSONAL_DETAILS_FORM)
        .locator('.field.app-column')
        .filter({ has: this.page.locator(`label.label:text-is("${SELECTORS.BACKUP_APPROVER_LABEL}")`) });
      const input = field.locator('.el-select input');
      await input.waitFor({ state: 'visible', timeout: 5000 });
      await input.fill(term, { timeout: 5000 });
      // Wait for virtualized dropdown results to appear
      await this.page.waitForTimeout(1000);
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillBackupApproverSearch] Could not type "${term}" into the backup approver search input. ` +
        `The dropdown may not be open or the input is not visible. Original: ${err.message}`
      );
    }
  }

  async selectFirstDropdownOption() {
    try {
      const option = this.page.locator('.el-vl__window span').first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click({ timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectFirstDropdownOption] Could not select the first dropdown option. ` +
        `No options appeared — the search may have returned no results. Original: ${err.message}`
      );
    }
  }

  async getBackupApproverText() {
    try {
      const field = this.page.locator(SELECTORS.PERSONAL_DETAILS_FORM)
        .locator('.field.app-column')
        .filter({ has: this.page.locator(`label.label:text-is("${SELECTORS.BACKUP_APPROVER_LABEL}")`) });
      const placeholder = field.locator('.el-select .el-select__placeholder span');
      await placeholder.waitFor({ state: 'visible', timeout: 10000 });
      return await placeholder.textContent();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getBackupApproverText] Could not read backup approver field text. ` +
        `The field may not be visible or the form didn't load. Original: ${err.message}`
      );
    }
  }

  async clearBackupApprover() {
    try {
      const field = this.page.locator(SELECTORS.PERSONAL_DETAILS_FORM)
        .locator('.field.app-column')
        .filter({ has: this.page.locator(`label.label:text-is("${SELECTORS.BACKUP_APPROVER_LABEL}")`) });
      const select = field.locator('.el-select');
      await select.hover({ timeout: 10000 });
      await this.page.waitForTimeout(500);
      // In Element Plus el-select-v2, the clear icon is a circle-close SVG that appears on hover
      const clearIcon = select.locator('.el-select__suffix .el-icon:visible').first();
      await clearIcon.click({ timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clearBackupApprover] Could not clear the backup approver selection. ` +
        `The clear icon may not be visible — ensure a value is selected and the field is not disabled. Original: ${err.message}`
      );
    }
  }

  async getDobInputValue() {
    try {
      const input = this.page.locator(SELECTORS.DOB_INPUT);
      await input.waitFor({ state: 'visible', timeout: 10000 });
      return await input.inputValue();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getDobInputValue] Could not read DOB input value (selector: ${SELECTORS.DOB_INPUT}). ` +
        `The personal details form may not be loaded. Original: ${err.message}`
      );
    }
  }

  // Directly types a date string into the DOB input (format: 'DD MMM YYYY', e.g. '15 Jan 1990').
  // Clicks first to trigger resetFieldValueIfMasked, then fills and confirms with Tab.
  async typeDobValue(dateString) {
    try {
      const input = this.page.locator(SELECTORS.DOB_INPUT);
      await input.waitFor({ state: 'visible', timeout: 10000 });
      await input.click({ timeout: 10000 });
      await input.fill(dateString);
      await input.press('Tab');
    } catch (err) {
      throw new Error(
        `[ProfilePage.typeDobValue] Could not type DOB value "${dateString}" into input (selector: ${SELECTORS.DOB_INPUT}). ` +
        `The field may be disabled or not visible. Original: ${err.message}`
      );
    }
  }


  // --- Form of Payment Tab ---

  async clickFormOfPaymentTab() {
    try {
      const tab = this.page.locator(SELECTORS.FORM_OF_PAYMENT_TAB);
      await tab.waitFor({ state: 'attached', timeout: 10000 });
      await tab.dispatchEvent('click');
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickFormOfPaymentTab] Could not click Form of Payment tab (selector: ${SELECTORS.FORM_OF_PAYMENT_TAB}). ` +
        `The profile page may not have loaded or the tab is hidden. Original: ${err.message}`
      );
    }
  }

  async waitForFopSection() {
    try {
      await this.page.locator(SELECTORS.FOP_SECTION).waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForFopSection] Form of Payment section did not appear (selector: ${SELECTORS.FOP_SECTION}). ` +
        `The tab may not have switched or the section failed to load. Original: ${err.message}`
      );
    }
  }

  async clickAddNewCard() {
    try {
      await this.page.locator(SELECTORS.FOP_ADD_CARD_BUTTON).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickAddNewCard] Could not click "Add New Card" button (selector: ${SELECTORS.FOP_ADD_CARD_BUTTON}). ` +
        `The FOP section may not be loaded. Original: ${err.message}`
      );
    }
  }

  async waitForFopForm() {
    try {
      await this.page.locator(SELECTORS.FOP_FORM).waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForFopForm] Card form did not appear (selector: ${SELECTORS.FOP_FORM}). ` +
        `The "Add New Card" button may not have been clicked. Original: ${err.message}`
      );
    }
  }

  async fillCardDisplayName(name) {
    try {
      await this.page.locator(SELECTORS.FOP_CARD_DISPLAY_NAME_INPUT).fill(name, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillCardDisplayName] Could not fill card display name "${name}" (selector: ${SELECTORS.FOP_CARD_DISPLAY_NAME_INPUT}). ` +
        `Original: ${err.message}`
      );
    }
  }

  async selectCardType(typeName) {
    try {
      await this.page.locator(SELECTORS.FOP_CARD_TYPE_SELECT).click({ timeout: 10000 });
      await this.page.locator(SELECTORS.DROPDOWN_OPTION).filter({ hasText: typeName }).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectCardType] Could not select card type "${typeName}" from dropdown. ` +
        `The dropdown may not have opened or the option doesn't exist. Original: ${err.message}`
      );
    }
  }

  async fillCardHolderName(name) {
    try {
      await this.page.locator(SELECTORS.FOP_CARD_HOLDER_INPUT).fill(name, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillCardHolderName] Could not fill card holder name "${name}" (selector: ${SELECTORS.FOP_CARD_HOLDER_INPUT}). ` +
        `Original: ${err.message}`
      );
    }
  }

  async insertCardNumber(cardNumber) {
    try {
      await this.page.locator(SELECTORS.FOP_INSERT_CARD_NUMBER_BUTTON).click({ timeout: 10000 });
      const modalInput = this.page.locator(SELECTORS.FOP_CARD_NUMBER_MODAL_INPUT);
      await modalInput.waitFor({ state: 'visible', timeout: 10000 });
      await modalInput.fill(cardNumber, { timeout: 10000 });
      await this.page.locator(SELECTORS.FOP_CARD_NUMBER_MODAL_SAVE).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.insertCardNumber] Could not insert card number into modal. ` +
        `The modal may not have opened or the save button failed. Original: ${err.message}`
      );
    }
  }

  async selectExpiryMonth(month) {
    try {
      await this.page.locator(SELECTORS.FOP_EXPIRY_MONTH_SELECT).click({ timeout: 10000 });
      await this.page.locator(SELECTORS.DROPDOWN_OPTION).filter({ hasText: new RegExp(`^\\s*${month}\\s*$`) }).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectExpiryMonth] Could not select expiry month "${month}". Original: ${err.message}`
      );
    }
  }

  async selectExpiryYear(year) {
    try {
      await this.page.locator(SELECTORS.FOP_EXPIRY_YEAR_SELECT).click({ timeout: 10000 });
      await this.page.locator(SELECTORS.DROPDOWN_OPTION).filter({ hasText: year }).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectExpiryYear] Could not select expiry year "${year}". Original: ${err.message}`
      );
    }
  }

  async fillBillingAddress(address) {
    try {
      await this.page.locator(SELECTORS.FOP_ADDRESS_INPUT).fill(address, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillBillingAddress] Could not fill address "${address}". Original: ${err.message}`
      );
    }
  }

  async fillBillingCity(city) {
    try {
      await this.page.locator(SELECTORS.FOP_CITY_INPUT).fill(city, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillBillingCity] Could not fill city "${city}". Original: ${err.message}`
      );
    }
  }

  async fillBillingZipCode(zipCode) {
    try {
      await this.page.locator(SELECTORS.FOP_ZIP_INPUT).fill(zipCode, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillBillingZipCode] Could not fill zip code "${zipCode}". Original: ${err.message}`
      );
    }
  }

  async selectBillingCountry(country) {
    try {
      await this.page.locator(SELECTORS.FOP_COUNTRY_SELECT).click({ timeout: 10000 });
      await this.page.getByRole('option', { name: country }).first().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectBillingCountry] Could not select country "${country}". Original: ${err.message}`
      );
    }
  }

  async selectBillingState(state) {
    try {
      const stateSelect = this.page.locator(SELECTORS.FOP_STATE_SELECT);
      const isVisible = await stateSelect.isVisible().catch(() => false);
      if (!isVisible) return;
      await stateSelect.click({ timeout: 10000 });
      await this.page.getByRole('option', { name: state }).first().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectBillingState] Could not select state "${state}". Original: ${err.message}`
      );
    }
  }

  async clickSaveFop() {
    try {
      await this.page.locator(SELECTORS.FOP_SAVE_BUTTON).click({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickSaveFop] Could not click Save FOP button (selector: ${SELECTORS.FOP_SAVE_BUTTON}). ` +
        `The form may have validation errors or the button is not visible. Original: ${err.message}`
      );
    }
  }

  async getCardHolderNameFromPreview() {
    try {
      const cardHolder = this.page.locator(SELECTORS.FOP_CARD_HOLDER_NAME_DISPLAY).last();
      await cardHolder.waitFor({ state: 'visible', timeout: 15000 });
      return (await cardHolder.textContent()).trim();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getCardHolderNameFromPreview] Could not read card holder name from preview (selector: ${SELECTORS.FOP_CARD_HOLDER_NAME_DISPLAY}). ` +
        `No card may be listed. Original: ${err.message}`
      );
    }
  }

  async getCardNameFromPreview() {
    try {
      const cardName = this.page.locator(SELECTORS.FOP_CARD_NAME_DISPLAY).last();
      await cardName.waitFor({ state: 'visible', timeout: 15000 });
      return (await cardName.textContent()).trim();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getCardNameFromPreview] Could not read card display name (alias) from preview (selector: ${SELECTORS.FOP_CARD_NAME_DISPLAY}). ` +
        `The card may not have saved or the preview is not visible. Original: ${err.message}`
      );
    }
  }

  async clickDeleteOnLastCard() {
    try {
      const actionBtn = this.page.locator(SELECTORS.FOP_CARD_ACTIONS_DROPDOWN).last();
      await actionBtn.click({ timeout: 10000 });
      await this.page.locator(SELECTORS.FOP_DELETE_CARD_OPTION).last().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickDeleteOnLastCard] Could not open actions menu or click delete option. ` +
        `The card may not exist or the dropdown failed to open. Original: ${err.message}`
      );
    }
  }

  async confirmRemoveFopCard() {
    try {
      const confirmBtn = this.page.locator(SELECTORS.CONFIRM_DELETE_BUTTON);
      await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
      await confirmBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.confirmRemoveFopCard] Could not confirm card removal (selector: ${SELECTORS.CONFIRM_DELETE_BUTTON}). ` +
        `The confirmation dialog may not have appeared. Original: ${err.message}`
      );
    }
  }

  async getCardPreviewCount() {
    try {
      await this.page.waitForTimeout(1000);
      return await this.page.locator(SELECTORS.FOP_CARD_PREVIEW).count();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getCardPreviewCount] Could not count card previews. Original: ${err.message}`
      );
    }
  }

  async waitForCardCountToSettle(expectedCount, timeout = 15000) {
    try {
      // Card removal is async (BE delete + profile reload) — auto-retry until the row leaves the DOM.
      await expect(this.page.locator(SELECTORS.FOP_CARD_PREVIEW)).toHaveCount(expectedCount, { timeout });
    } catch (err) {
      const actual = await this.page.locator(SELECTORS.FOP_CARD_PREVIEW).count();
      throw new Error(
        `[ProfilePage.waitForCardCountToSettle] Card list did not settle to ${expectedCount} card(s) ` +
        `within ${timeout}ms (still ${actual}). The delete request may not have completed. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the profile owner's name from the <h1> above the tabs on the standalone /user/:userId
   * page. Returns an empty string when the header is absent (the embedded dialog renders with
   * hideProfileHeader), so the DSL owns the "who does this profile belong to" verdict.
   * @param {number} [timeoutMs=20000]
   * @returns {Promise<string>}
   */
  async getUserProfilePageOwnerName(timeoutMs = 20000) {
    const heading = this.page.locator(SELECTORS.USER_PROFILE_PAGE_OWNER_NAME).first();
    try {
      await heading.waitFor({ state: 'visible', timeout: timeoutMs });
    } catch {
      return '';
    }
    return ((await heading.textContent()) || '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Name of the SELECTED tab on the standalone /user/:userId page, e.g. "passportsAndVisas" — the
   * el-tabs item id with its `tab-` prefix stripped, matching the keys of user-profile.ts#dataTabMap
   * and the `?tab=` query those routes carry.
   *
   * Page-side sibling of getActiveDialogTabName: same `.el-tabs__item.is-active` signal, scoped to
   * the page section instead of a dialog. Returning the NAME rather than a per-tab boolean is what
   * lets one DSL check serve every deep link — the document-expiry warnings alone target two
   * different tabs (passport/visa -> passportsAndVisas, credit card -> formOfPayment).
   *
   * @param {number} [timeoutMs=20000]
   * @returns {Promise<string|null>} null when no tab is selected — the DSL turns that into a
   *   descriptive failure.
   */
  async getActiveProfilePageTabName(timeoutMs = 20000) {
    const activeTab = this.page
      .locator(SELECTORS.USER_PROFILE_PAGE)
      // DIALOG_ACTIVE_TAB is the generic el-tabs "selected header" marker despite its name — the
      // scoping above, not the constant, is what makes this the page rather than the dialog.
      .locator(SELECTORS.DIALOG_ACTIVE_TAB)
      .first();
    // The section paints before the profile loads (v-if="userProfile" guards the tab strip), so
    // reading straight away finds no active tab.
    try {
      await activeTab.waitFor({ state: 'visible', timeout: timeoutMs });
    } catch {
      // Deliberately swallowed: the caller turns a null tab name into a descriptive failure.
    }
    const id = await activeTab.getAttribute('id').catch(() => null);
    return id ? id.replace(/^tab-/, '') : null;
  }

  // --- Passports & Visas Tab ---

  async clickPassportsVisasTab() {
    try {
      const tab = this.page.locator(SELECTORS.PASSPORTS_VISAS_TAB);
      await tab.waitFor({ state: 'attached', timeout: 10000 });
      await tab.dispatchEvent('click');
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickPassportsVisasTab] Could not click Passports & Visas tab (selector: ${SELECTORS.PASSPORTS_VISAS_TAB}). ` +
        `The profile page may not have loaded or the tab is hidden. Original: ${err.message}`
      );
    }
  }

  async fillKnownTravelerNumber(value) {
    try {
      const input = this.page.locator(SELECTORS.KNOWN_TRAVELER_INPUT);
      await input.waitFor({ state: 'visible', timeout: 10000 });
      // Triple-click to select any existing value, then use pressSequentially so
      // each keystroke fires the keyboard events needed for Vue v-model to update.
      await input.click({ clickCount: 3, timeout: 10000 });
      await input.pressSequentially(value, { delay: 50 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillKnownTravelerNumber] Could not fill known traveler number "${value}" (selector: ${SELECTORS.KNOWN_TRAVELER_INPUT}). ` +
        `The Passports & Visas tab may not be open or the additional-inputs section is not visible. Original: ${err.message}`
      );
    }
  }

  async getKnownTravelerNumberValue() {
    try {
      const input = this.page.locator(SELECTORS.KNOWN_TRAVELER_INPUT);
      await input.waitFor({ state: 'visible', timeout: 10000 });
      return await input.inputValue();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getKnownTravelerNumberValue] Could not read known traveler number field (selector: ${SELECTORS.KNOWN_TRAVELER_INPUT}). ` +
        `The Passports & Visas tab may not be open. Original: ${err.message}`
      );
    }
  }

  async clearKnownTravelerNumber() {
    try {
      const input = this.page.locator(SELECTORS.KNOWN_TRAVELER_INPUT);
      await input.waitFor({ state: 'visible', timeout: 10000 });
      // Triple-click to select the existing value, then Delete — real key events
      // so Vue v-model registers the field as empty (fill('') would not).
      await input.click({ clickCount: 3, timeout: 10000 });
      await input.press('Delete');
    } catch (err) {
      throw new Error(
        `[ProfilePage.clearKnownTravelerNumber] Could not clear known traveler number (selector: ${SELECTORS.KNOWN_TRAVELER_INPUT}). ` +
        `The Passports & Visas tab may not be open. Original: ${err.message}`
      );
    }
  }

  async waitForPassportVisaForm() {
    try {
      await this.page.locator(SELECTORS.PASSPORT_VISA_FORM).waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForPassportVisaForm] Passport & Visa form did not appear (selector: ${SELECTORS.PASSPORT_VISA_FORM}). ` +
        `The tab may not have switched or the form failed to load. Original: ${err.message}`
      );
    }
  }

  async ensurePassportExists() {
    const passportInputs = this.page.locator(SELECTORS.PASSPORT_INPUTS);
    const count = await passportInputs.count();
    if (count > 0) return;

    // No passport exists — click "Add new passport" to create an empty entry
    try {
      const addPassportBtn = this.page.getByText('Add new passport');
      await addPassportBtn.waitFor({ state: 'visible', timeout: 10000 });
      await addPassportBtn.click({ timeout: 10000 });
      await this.page.locator(SELECTORS.PASSPORT_INPUTS).first().waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.ensurePassportExists] Could not add a passport entry. ` +
        `The "Add new passport" button may not be visible. Original: ${err.message}`
      );
    }
  }

  async clickAddVisa() {
    try {
      const addVisaBtn = this.page.getByText('Add new visa').first();
      await addVisaBtn.waitFor({ state: 'visible', timeout: 10000 });
      await addVisaBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickAddVisa] Could not click "Add new visa" button. ` +
        `A passport entry must exist first — visas are nested under a passport. Original: ${err.message}`
      );
    }
  }

  async selectVisaCountry(countryName) {
    try {
      const visaCountrySelect = this.page.locator(SELECTORS.VISA_COUNTRY_SELECT).last();
      await visaCountrySelect.click({ timeout: 10000 });
      // Filterable app-select: type to filter, then pick the visible option
      const input = visaCountrySelect.locator('input');
      await input.waitFor({ state: 'visible', timeout: 5000 });
      await input.fill(countryName);
      const option = this.page.locator('.el-select-dropdown__item:visible').filter({ hasText: new RegExp(`^${countryName}`, 'i') }).first();
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click({ timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectVisaCountry] Could not select visa country "${countryName}". ` +
        `The dropdown may not have opened, the input may not be filterable, or the country option doesn't exist. Original: ${err.message}`
      );
    }
  }

  async openVisaDatePicker() {
    try {
      const dateInput = this.page.locator(SELECTORS.VISA_VALID_UNTIL_INPUT).last();
      await dateInput.waitFor({ state: 'visible', timeout: 10000 });
      await dateInput.click({ timeout: 10000 });
      await this.page.locator(SELECTORS.DATE_PICKER_PANEL).waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.openVisaDatePicker] Could not open the visa "Valid until" date picker. ` +
        `The visa row may not have been added or the input is not visible. Original: ${err.message}`
      );
    }
  }

  async clickNextYearArrow(times = 1) {
    try {
      for (let i = 0; i < times; i++) {
        const arrow = this.page.locator(SELECTORS.DATE_PICKER_NEXT_YEAR_ARROW).first();
        await arrow.waitFor({ state: 'visible', timeout: 5000 });
        await arrow.click({ timeout: 5000 });
        await this.page.waitForTimeout(300);
      }
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickNextYearArrow] Could not click next-year arrow ${times} time(s). ` +
        `The date picker panel may not be visible or the year arrows are not rendered (showYearArrows must be true). Original: ${err.message}`
      );
    }
  }

  async selectFirstAvailableDay() {
    try {
      const panel = this.page.locator(SELECTORS.DATE_PICKER_PANEL);
      const day = panel.locator('td.available .el-date-table-cell__text').first();
      await day.waitFor({ state: 'visible', timeout: 5000 });
      await day.click({ timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.selectFirstAvailableDay] Could not select a day from the date picker calendar. ` +
        `No available day cells were found — the calendar may not be visible. Original: ${err.message}`
      );
    }
  }

  async fillVisaNumber(number) {
    try {
      const input = this.page.locator(SELECTORS.VISA_NUMBER_INPUT).last();
      await input.waitFor({ state: 'visible', timeout: 10000 });
      await input.fill(number, { timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillVisaNumber] Could not fill visa number "${number}" (selector: ${SELECTORS.VISA_NUMBER_INPUT}). ` +
        `The visa form row may not have been added. Original: ${err.message}`
      );
    }
  }

  async clickSavePassportsVisas() {
    try {
      const saveBtn = this.page.locator(SELECTORS.SAVE_PASSPORTS_VISAS_BUTTON).first();
      await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
      await saveBtn.click({ timeout: 10000 });
      await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickSavePassportsVisas] Could not click "Save Passports and Visas" button (selector: ${SELECTORS.SAVE_PASSPORTS_VISAS_BUTTON}). ` +
        `The form may have validation errors or the button is not visible. Original: ${err.message}`
      );
    }
  }

  async clickRemoveVisa() {
    try {
      const removeBtn = this.page.locator(SELECTORS.VISA_REMOVE_BUTTON).last();
      await removeBtn.waitFor({ state: 'visible', timeout: 10000 });
      await removeBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickRemoveVisa] Could not click remove button on visa (selector: ${SELECTORS.VISA_REMOVE_BUTTON}). ` +
        `No visa entry may exist or the remove icon is not visible. Original: ${err.message}`
      );
    }
  }

  async confirmRemovePassportVisa() {
    try {
      const confirmBtn = this.page.locator(SELECTORS.CONFIRM_DELETE_BUTTON);
      await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
      await confirmBtn.click({ timeout: 10000 });
      // Wait for dialog to close and any triggered API call to complete
      await confirmBtn.waitFor({ state: 'hidden', timeout: 10000 });
      await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.confirmRemovePassportVisa] Could not confirm the delete dialog (selector: ${SELECTORS.CONFIRM_DELETE_BUTTON}). ` +
        `The confirmation dialog may not have appeared after clicking remove. Original: ${err.message}`
      );
    }
  }

  // --- User profile mandatory-field dialog popup ---

  async waitForProfilePopup() {
    try {
      await this.page
        .locator(SELECTORS.USER_PROFILE_DIALOG)
        .waitFor({ state: 'visible', timeout: 20000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.waitForProfilePopup] The user profile dialog popup did not appear ` +
        `(selector: ${SELECTORS.USER_PROFILE_DIALOG}). ` +
        `The popup shows when a traveler is added with missing mandatory fields. ` +
        `Verify the mobile field is cleared in the administration before the test. ` +
        `Original: ${err.message}`
      );
    }
  }

  async getMandatoryFieldLabel() {
    try {
      const label = this.page.locator(SELECTORS.PROFILE_POPUP_MANDATORY_LABEL).first();
      await label.waitFor({ state: 'visible', timeout: 10000 });
      return (await label.textContent()).trim();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getMandatoryFieldLabel] Could not read the mandatory field label inside the profile popup ` +
        `(selector: ${SELECTORS.PROFILE_POPUP_MANDATORY_LABEL}). ` +
        `The popup must be open and the mandatory field label must carry the CSS class "mandatory". ` +
        `Original: ${err.message}`
      );
    }
  }

  async getValidationMessage() {
    try {
      const msg = this.page.locator(SELECTORS.PROFILE_POPUP_VALIDATION_MSG).first();
      await msg.waitFor({ state: 'visible', timeout: 10000 });
      return (await msg.textContent()).trim();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getValidationMessage] Could not read the validation message inside the profile popup ` +
        `(selector: ${SELECTORS.PROFILE_POPUP_VALIDATION_MSG}). ` +
        `The validation message ("Invalid phone number") appears only when the phone field is touched and invalid. ` +
        `Original: ${err.message}`
      );
    }
  }

  async getInfoMessage() {
    try {
      const msg = this.page.locator(SELECTORS.PROFILE_POPUP_INFO_MSG).first();
      await msg.waitFor({ state: 'visible', timeout: 10000 });
      return (await msg.textContent()).trim();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getInfoMessage] Could not read the info message inside the profile popup ` +
        `(selector: ${SELECTORS.PROFILE_POPUP_INFO_MSG}). ` +
        `The message "Please fill all required fields which are marked" only appears when the form is submitted with invalid data. ` +
        `Original: ${err.message}`
      );
    }
  }

  async fillMobileInPopup({ countryCode, areaCode, number }) {
    try {
      // Open country-code dropdown
      const countryBtn = this.page.locator(SELECTORS.PROFILE_POPUP_MOBILE_COUNTRY_BTN);
      await countryBtn.waitFor({ state: 'visible', timeout: 10000 });
      await countryBtn.click();

      // Search for the dial code and pick the first matching option
      const searchInput = this.page.locator(SELECTORS.PHONE_INPUT_POPOVER_SEARCH);
      await searchInput.waitFor({ state: 'visible', timeout: 5000 });
      await searchInput.fill(countryCode);
      const option = this.page.locator(SELECTORS.PHONE_INPUT_POPOVER_OPTION)
        .filter({ hasText: `+${countryCode}` })
        .first();
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click();

      // Fill area code and phone number
      const areaInput = this.page.locator(SELECTORS.PROFILE_POPUP_MOBILE_AREA);
      await areaInput.waitFor({ state: 'visible', timeout: 5000 });
      await areaInput.fill(areaCode);
      const numberInput = this.page.locator(SELECTORS.PROFILE_POPUP_MOBILE_NUMBER);
      await numberInput.fill(number);
    } catch (err) {
      throw new Error(
        `[ProfilePage.fillMobileInPopup] Failed to fill mobile number (country: "${countryCode}", area: "${areaCode}", number: "${number}") in the profile popup. ` +
        `The popup must be open and the mobile field must be editable. ` +
        `Original: ${err.message}`
      );
    }
  }

  async clickSaveInPopup() {
    try {
      const saveBtn = this.page.locator(SELECTORS.PROFILE_POPUP_SAVE_BTN);
      await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
      await saveBtn.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ProfilePage.clickSaveInPopup] Could not click the Save button inside the profile popup ` +
        `(selector: ${SELECTORS.PROFILE_POPUP_SAVE_BTN}). ` +
        `All mandatory fields must be valid before saving. Original: ${err.message}`
      );
    }
  }

  /**
   * Both mandate-fields dialogs share `.app-dialog.user-profile-dialog`, so the el-dialog
   * title is the only reliable discriminator. Returns the dialog locator for one title.
   */
  dialogByTitle(title) {
    return this.page
      .locator(SELECTORS.USER_PROFILE_DIALOG)
      .filter({ has: this.page.locator(SELECTORS.DIALOG_TITLE, { hasText: title }) });
  }

  /**
   * Titles of every user-profile dialog currently visible. Used to build a useful failure
   * message when the wrong one of the two opened.
   */
  async getOpenUserProfileDialogTitles() {
    const titles = await this.page
      .locator(SELECTORS.USER_PROFILE_DIALOG + ":visible " + SELECTORS.DIALOG_TITLE)
      .allTextContents();
    return titles.map((t) => t.trim()).filter(Boolean);
  }

  async waitForDialogByTitle(title, timeoutMs = 25000) {
    try {
      await this.dialogByTitle(title).first().waitFor({ state: "visible", timeout: timeoutMs });
    } catch (err) {
      const open = await this.getOpenUserProfileDialogTitles();
      throw new Error(
        `[ProfilePage.waitForDialogByTitle] No user profile dialog titled "${title}" appeared within ` +
        `${timeoutMs}ms. Dialogs open instead: ${open.length ? open.map((t) => `"${t}"`).join(", ") : "none"}. ` +
        "Which dialog opens is driven by the traveller's profile privileges and their missing " +
        `mandate fields — verify both before treating this as a locator problem. Original: ${err.message}`,
      );
    }
  }

  /**
   * Resolves once no dialog with this title is showing. A missing dialog counts as hidden, so
   * this returns immediately in the normal case instead of burning the timeout. The assertion
   * itself belongs to the DSL — Page Objects never assert.
   *
   * Settles first: because "hidden" is satisfied by an element that was never rendered, calling
   * this the instant after a traveller is selected would pass before either dialog had a chance to
   * mount — a zero-wait snapshot, not a check. Waiting for ANY user-profile dialog to appear (the
   * two are mutually exclusive, so one of them will) gives the render a bounded chance to happen,
   * and a timeout here is not an error: some flows legitimately raise no dialog at all.
   * @param {string} title
   * @param {number} [timeoutMs=10000]
   * @param {number} [settleMs=3000]
   */
  async waitForDialogByTitleHidden(title, timeoutMs = 10000, settleMs = 3000) {
    await this.page
      .locator(SELECTORS.USER_PROFILE_DIALOG)
      .first()
      .waitFor({ state: "visible", timeout: settleMs })
      .catch(() => {});

    await this.dialogByTitle(title).first().waitFor({ state: "hidden", timeout: timeoutMs });
  }

  async getDialogBodyText(title) {
    const body = this.dialogByTitle(title).first().locator(SELECTORS.USER_PROFILE_DIALOG_BODY);
    try {
      await body.waitFor({ state: "visible", timeout: 15000 });
      return (await body.innerText()).trim();
    } catch (err) {
      throw new Error(
        `[ProfilePage.getDialogBodyText] Could not read the body of the dialog titled "${title}" ` +
        `(selector: ${SELECTORS.USER_PROFILE_DIALOG_BODY}). Original: ${err.message}`,
      );
    }
  }

  /**
   * el-tab-pane name of the tab the dialog is currently showing (e.g. "personalDetails").
   * Element Plus renders each tab header with id="tab-<name>", so the name is recovered from
   * the id of the header carrying .is-active.
   */
  async getActiveDialogTabName(title, timeoutMs = 20000) {
    const dialog = this.dialogByTitle(title).first();
    await dialog.waitFor({ state: "visible", timeout: 15000 });
    const activeTab = dialog.locator(SELECTORS.DIALOG_ACTIVE_TAB).first();
    // el-dialog paints its header as soon as it opens, but the tab strip is only rendered once
    // the profile has loaded (v-if="userProfile") — reading straight away finds no active tab.
    try {
      await activeTab.waitFor({ state: "visible", timeout: timeoutMs });
    } catch {
      // Deliberately swallowed: the caller turns a null tab name into a descriptive failure.
    }
    const id = await activeTab.getAttribute("id").catch(() => null);
    return id ? id.replace(/^tab-/, "") : null;
  }

  /**
   * True when the Date of Birth label carries the `mandatory` class, i.e. the red star is painted
   * because Date of Birth is configured as a mandate field.
   */
  async isDobFieldMarkedMandatory(title, timeoutMs = 20000) {
    const dialog = this.dialogByTitle(title).first();
    await dialog.waitFor({ state: "visible", timeout: 15000 });
    const label = dialog.locator(SELECTORS.PROFILE_DIALOG_DOB_FIELD_LABEL).first();
    try {
      await label.waitFor({ state: "visible", timeout: timeoutMs });
    } catch {
      // Deliberately swallowed: the caller reports the missing label as the failure.
    }
    const classAttr = (await label.getAttribute("class").catch(() => "")) || "";
    return classAttr.split(/\s+/).includes(SELECTORS.PROFILE_DIALOG_MANDATORY_CLASS);
  }

  /**
   * Closes one of the two user-profile dialogs via its header button and waits for it to go.
   * Used to leave a traveller's popup without saving, so the next traveller can be selected.
   */
  async closeDialogByTitle(title, timeoutMs = 15000) {
    const dialog = this.dialogByTitle(title).first();
    try {
      await dialog.locator(SELECTORS.DIALOG_CLOSE_BTN).first().click({ timeout: timeoutMs });
      await dialog.waitFor({ state: "hidden", timeout: timeoutMs });
    } catch (err) {
      throw new Error(
        `[ProfilePage.closeDialogByTitle] Could not close the dialog titled "${title}" via its header ` +
        `button (selector: ${SELECTORS.DIALOG_CLOSE_BTN}). Original: ${err.message}`,
      );
    }
  }

  /**
   * Reads the Email value from the Personal Details tab of an open profile dialog — the popup's
   * own record of whose profile it loaded. Returns the raw value; the comparison belongs to the
   * DSL, since Page Objects never assert.
   *
   * The Personal Details tab is waited for rather than assumed: the popup lands on the tab holding
   * the first missing mandate field, so on a profile missing a contact-information field the email
   * input would not be mounted yet at the moment this is called.
   * @param {string} title
   * @param {number} [timeoutMs=20000]
   * @returns {Promise<string>} the trimmed email, or "" when the input never appeared
   */
  async getDialogEmailValue(title, timeoutMs = 20000) {
    const dialog = this.dialogByTitle(title).first();
    await dialog.waitFor({ state: "visible", timeout: 15000 });
    const emailInput = dialog.locator(SELECTORS.PROFILE_DIALOG_EMAIL_INPUT).first();
    try {
      await emailInput.waitFor({ state: "visible", timeout: timeoutMs });
    } catch {
      // Deliberately swallowed: the DSL reports the empty value as the failure, with the
      // traveller it expected, which is a far more useful message than a locator timeout.
      return "";
    }
    return ((await emailInput.inputValue().catch(() => "")) || "").trim();
  }

  /**
   * Editability signals for an open profile dialog: the Save button only renders when the
   * form is not read-only, and read-only forms disable every input.
   */
  async getDialogEditability(title, timeoutMs = 20000) {
    const dialog = this.dialogByTitle(title).first();
    await dialog.waitFor({ state: "visible", timeout: 15000 });
    // Same race as countVisibleMandatoryLabels: wait for the form to mount inside the dialog,
    // otherwise both counts below read zero and a perfectly editable popup looks read-only.
    try {
      await dialog.locator(SELECTORS.PROFILE_DIALOG_ANY_INPUT).first().waitFor({ state: "visible", timeout: timeoutMs });
    } catch {
      // Deliberately swallowed: the counts below describe the failure.
    }
    const saveButtons = await dialog.locator(SELECTORS.PROFILE_DIALOG_SAVE_BTN + ":visible").count();
    const editableInputs = await dialog.locator(SELECTORS.PROFILE_DIALOG_EDITABLE_INPUT).count();
    return { saveButtons, editableInputs };
  }
}

module.exports = ProfilePage;
