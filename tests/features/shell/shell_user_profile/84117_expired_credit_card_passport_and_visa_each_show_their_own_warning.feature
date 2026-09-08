# Test Name: 84117 Profile - Expired credit card, passport and visa each show their own warning
# Description: A traveller whose credit card, passport AND visa have all expired sees three separate
#              warnings on the homepage — one per document, none merged and none dropped — each
#              offering the action for its own document type. The passport warning's
#              "Update Passport" button opens the profile in a new tab on the passports and visas
#              section.
# Status: Active
# Labels: Regression,Shell,Profile,Credit card,Passport,Visa,Document expiry
# ADO: Test Case 84117 (rev 2)
# Owner: Pini Harush
# Created: 2026-09-06
#
# Sibling of 84116, which covers the OTHER half of AB#65307: one document across two surfaces
# (traveller's homepage vs booker's trip search). This one covers three documents on one surface.
#
# Environment: NOT YET RUNNABLE on atriis-stg.app — AB#65307 is merged to Atriis.App main but is not
#   in the build staging serves (evidence in the 84116 feature header). Runs on atriis-dev.app.
#
# Preconditions (environment/data, not automatable here):
#   - Feature flag "Atriis.App.OBT.IsDocumentExpiryRemindersEnabled" is ON for the corporation.
#     document-expiry-alerts.ts returns early when it is off and nothing renders at all. The flag is
#     managed remotely in the internal Atriis app, so it cannot be asserted from here.
#   - "yael@ps.com" has ALL THREE on file, each already past its expiry date (not merely within 60
#     days — that renders "... expiring soon", a different title):
#       * a passport with a past validUntil
#       * a visa under that passport with a past validUntil
#       * a personal credit card with a past expiry month
#   - Exactly one of each. document-expiry.logic.ts raises one alert per affected document — a
#     passport, EACH of its visas, and EACH personal credit card — so a second expired visa would
#     make this a four-warning profile and the count step would (correctly) fail.
#   - The credit card must be personal and non-virtual: isRenewableByTraveller() drops virtual cards,
#     and agency/central cards never reach the traveller's own formOfPayment list.
#
# Why the count and the per-document steps are both asserted:
#   The count alone would pass if three cards rendered for the wrong documents; the per-document
#   steps alone would pass if a fourth, unexpected warning were also present. Together they pin
#   "exactly one warning per expired document, and these are the documents".
#
# The button on each card is asserted rather than assumed. getCtaKey() derives the label from the
# document type, so a "Credit card expired" card offering "Update Passport" would be a real defect —
# the user would be sent to the wrong section — and no title-only or count-only check would see it.
#
# The "Update Passport" click opens a new tab (utilService.openNewWindow at a desktop viewport), so
# that step swaps the World's active page onto it. The final assertion runs against the profile.
# Whose profile is deliberately NOT asserted here: on the traveller's own homepage there is no other
# traveller it could belong to. 84116 covers that, where a booker's warning can open the wrong one.

# ADO Test Case ID: 84117
@ado:84117
@regression @shell @profile @credit_card @passport @visa @document_expiry @tc-84117
Feature: 84117 Profile - Expired credit card, passport and visa each show their own warning
  As a corporate traveller whose credit card, passport and visa have all expired
  I want a separate warning for every expired document as soon as I log in
  So that I can update all of them before they disrupt a trip

  @priority:high
  Scenario: A warning per expired document is displayed and Update Passport opens the passports and visas section
    Given I am logged in as "yael@ps.com"
    Then 3 document expiry warnings should be displayed on the homepage
    And the "Credit card expired" document expiry warning should carry the "Update Card" button
    And the "Passport expired" document expiry warning should carry the "Update Passport" button
    And the "Visa expired" document expiry warning should carry the "Update Visa" button
    When I click the "Update Passport" button in the "Passport expired" document expiry warning
    Then the user profile should open in a new tab on the passports and visas section
