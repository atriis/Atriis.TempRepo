# Test Name: 85263 Profile - Expired card indicator on the Form of Payment tab
# Description: A traveller whose profile holds a stored credit card that has expired since it was
#              added sees a red-dot indicator on the "Form of payment" tab the moment the profile
#              opens — before that tab is opened — and, once inside the tab, the expired card itself
#              carries an "Expired" label so the specific card can be identified.
# Status: Active
# Labels: Regression,Shell,Profile,Credit card,Form of payment,Document expiry
# ADO: Test Case 85263 (rev 1), User Story 83252
# Owner: Pini Harush
# Created: 2026-09-22
#
# Covers AB#83252 acceptance criterion 1 — the only criterion with a UI surface a UI test can reach:
#   "Given a traveler profile in OBT self-service with a stored credit card whose expiry date is in
#    the past, if the profile is opened, then the Form of Payment tab displays a red-dot indicator,
#    visible regardless of which tab is active."
#
# Implementation the two assertions are pinned to (Atriis.OBT):
#   - The dot: user-profile.vue renders <span class="tab-alert-dot"
#     data-testid="user-profile.tabs.form-of-payment-expired-card-dot"> inside the formOfPayment
#     el-tab-pane label, behind v-if="showExpiredCardIndicator" — user-profile.ts:101 delegating to
#     hasExpiredCreditCard() (document-expiry.logic.ts:218), which is true when ANY entry in the
#     profile's formOfPayment array has a creditCard.expirationDate in the past.
#   - The label: profile-form-of-payment.vue renders <p class="app-label expired"
#     data-testid="user-profile.form-of-payment.expired-card-tag">{{ $t('selectCreditCard.cardExpired') }}
#     behind v-if="isCardExpired(form)", once per card row, so the label is per-card and not a
#     page-level banner.
#
# Environment: PASSES on atriis-dev.app (verified 2026-09-22, 5/5 steps, 11s). Not yet run against
#   atriis-stg.app — that needs the same card set-up on this user there, which is a data question
#   rather than a build one: AB#83252 is merged and the indicator is what dev renders.
#
#   Neither indicator can be located by its data-testid against a DEPLOYED environment. Atriis.OBT's
#   vite.config.ts installs a `removeDataTestId` Vue AST transform for every mode except
#   development/loc/local-stg (ADR-002, "keep the production DOM clean"), so the attributes the .vue
#   files declare are compiled away on dev and staging alike. Both selectors therefore match the
#   testid first and fall back to the styling class, which is the half that actually fires here —
#   see the comment on FOP_TAB_EXPIRED_CARD_DOT in src/pages/ProfilePage.js. Do not "simplify" them
#   back to testid-only: it passes a local vite dev server and fails everywhere else.
#
# Why the dot is asserted BEFORE the Form of Payment tab is opened:
#   "visible regardless of which tab is active" is the whole point of the story — the traveller is
#   meant to learn about the expired card without going looking for it. Asserting the dot only after
#   opening the tab would pass even if the indicator rendered exclusively on the active pane, which
#   is precisely the defect the criterion guards against. The profile lands on Personal Details, so
#   the third step below reads the dot from a non-active tab, which is the condition under test.
#
# Why the card is named rather than counted:
#   AB#83252 also requires that "if a profile has multiple stored cards and only one has expired, the
#   indicator must reflect the expired card specifically". A count-based or first-row assertion would
#   pass if the "Expired" label landed on the wrong row of a multi-card profile. The step scopes to
#   the .card-preview whose .card-name is "test-expired-fop" and asserts the label inside THAT row,
#   so a label on a sibling card fails rather than satisfies it.
#
# Preconditions (environment/data, not automatable here):
#   - "pini@gov.nl" is an OBT self-service corporate user who can view and edit their own profile.
#     The profile is read through the ordinary "My profile" route; no privilege is asserted here.
#   - The profile holds a stored, non-virtual personal credit card with the display name
#     "test-expired-fop" whose expirationDate is strictly in the past. Strictly: a card expiring
#     exactly today is valid per AB#83252 and would (correctly) fail both steps.
#   - That card must stay on the profile. This scenario is read-only — it adds, edits and deletes
#     nothing — so the data holds across runs, but a run of a FOP test that clears the card list
#     (e.g. deleteAllCreditCards) against this same user would strand it.
#
# Not covered here, and why: the remaining AB#83252 criteria are data-shape variants of the same
#   indicator (card expiring exactly today, mixed expired/valid cards, no card on file) or negative
#   surfaces (GTP, Admin). Each needs its own dedicated user with that exact card set-up, which this
#   user cannot provide — asserting them from this profile would prove nothing about the variant.

# ADO Test Case ID: 85263
@ado:85263
@regression @shell @profile @credit_card @form_of_payment @document_expiry @us-83252 @tc-85263
Feature: 85263 Profile - Expired card indicator on the Form of Payment tab
  As a business traveller with a credit card that expired while sitting on my profile
  I want the Form of Payment tab to flag it as soon as I open my profile
  So that I find out about the expired card without having to go looking for it

  @priority:high
  Scenario: A stored expired credit card marks the Form of Payment tab and is labelled Expired
    Given I am logged in as "pini@gov.nl"
    When I navigate to my user profile
    Then a red dot indicator should be displayed on the "Form of payment" profile tab
    When I open the form of payment tab in my profile
    Then the credit card "test-expired-fop" should be marked as "Expired" in the form of payment list
