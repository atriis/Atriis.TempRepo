# Test Name: 84896 Profile - Expiry warning respects the profile edit privilege
# Description: A user who may not edit their own profile gets no document expiry warning on their
#              homepage, and no "Update ..." call-to-action, even with an expired document on file.
#              The warning's only action opens the profile for editing, so showing it to someone who
#              may not edit that profile hands them a call to action they cannot complete (AB#84862).
# Status: Active
# Labels: Regression,Shell,Profile,Privileges,Document expiry
# ADO: Test Case 84896 (rev 4), User Story 84862
# Owner: Yael Alef
# Created: 2026-09-17
#
# Negative sibling of 84116 / 84117, which cover the warning being SHOWN (AB#65307). This one
# covers the visibility gate AB#84862 added ahead of that logic: canShowExpiryAlerts()
# (document-expiry.logic.ts) suppresses every alert for a profile whose userProfile response
# carries editDiabled:false — the historical, inverted name; false means "not editable".
#
# Environment: PASSES on atriis-dev.app (verified 2026-09-17, 3/3 steps, storeAlertCount 0).
#   NOT YET RUNNABLE on atriis-stg.app: AB#84862 is not in the build staging serves. Its entry
#   bundle carries "alertsByUserId" but no "editDiabled", and minifiers do not rename property
#   accesses, so canShowExpiryAlerts() is absent rather than spelled differently. On staging the
#   scenario fails at its second step with two "Passport expired" cards and their "Update Passport"
#   buttons rendered for a profile the user may not edit — the very defect this test exists to
#   catch. Nothing here needs changing when the release reaches staging.
#
#   AB#65307 itself IS on staging now (the homepage requests the reminders flag and dispatches
#   loadForSelf), so the staging gap recorded in the 84116 and 84117 headers is closed for them.
#
# Preconditions (environment/data, not automatable here) — all VERIFIED on atriis-dev.app 2026-09-17:
#   - "testuser@atriis.com" is Ana Carvalho, corporate user 53267596. GET /api/v3/userProfile
#     returns "editDiabled": false for her, which is exactly the field the gate reads, so AB#84862
#     requires every alert on her profile to be suppressed.
#   - She carries TWO already-expired passports (ids 52882 and 52883, validUntil 2026-01-02 and
#     2026-01-15) and no personal credit card. This is what stops the scenario passing vacuously:
#     an empty profile would raise no warning whatever the gate did, whereas these two documents
#     raise two alerts the moment the gate is missing — which is precisely what staging shows.
#   - The feature flag "Atriis.App.OBT.IsDocumentExpiryRemindersEnabled" is ON for the corporation.
#     document-expiry-alerts.ts returns early when it is off and the stack never renders, so with
#     the flag off this scenario would pass for the wrong reason. The flag is managed remotely in
#     the internal Atriis app and cannot be asserted from here, which is why both steps below sit
#     behind a store guard (ensureDocumentExpiryEvaluationRan, src/dsl/Homepage.js) that FAILS when
#     the evaluation never ran at all, rather than reading its silence as a pass.
#
# Why both the warning and the call-to-action are asserted:
#   ADO step 2 asks for both, and Yael confirmed on the work item (2026-09-17, with a screenshot of
#   a homepage carrying two "Update Passport" cards) that "this should not show" means the whole
#   card, action included. The gate suppresses the alert wholesale, so a card rendered WITHOUT its
#   button would be a different defect from no card at all — asserting the button separately, and
#   page-wide rather than scoped to the card, is what tells those two apart.

# ADO Test Case ID: 84896
@ado:84896
@regression @shell @profile @privileges @document_expiry @us-84862 @tc-84896
Feature: 84896 Profile - Expiry warning respects the profile edit privilege
  As a user who may not update any profile, including my own
  I want no expiry warning for a profile I cannot edit
  So that I am not handed a call to action I have no way to complete

  @priority:high
  Scenario: Prevent-update privilege - no expiry warning and no Update action on my own homepage
    Given I am logged in as "testuser@atriis.com"
    # "Update Passport" is i18n copy (documentExpiry.passport.cta) and the language is persisted on
    # the profile, so a session that left this account in another language would find no button by
    # that name and pass the last step without proving anything. The card assertion is
    # language-independent; only the button one needs this baseline.
    And I switch the application language to "English (UK)"
    Then no document expiry warning should be displayed on the homepage
    And no "Update Passport" document expiry button should be displayed on the homepage
