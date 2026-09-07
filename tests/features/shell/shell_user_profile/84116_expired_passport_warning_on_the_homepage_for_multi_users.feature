# Test Name: 84116 Profile - Expired passport warning on the homepage for multi users
# Description: One expiry-warning component (AB#65307) serves two surfaces, and this covers both in
#              one pass: after login the signed-in traveller sees their OWN expired-passport warning
#              on the homepage, and once they open a trip and add a second traveller, that
#              traveller's expired passport raises its own warning on the trip search page — named,
#              because on a booker's screen a warning belongs to someone other than the viewer. Its
#              "Update Passport" button opens THAT traveller's profile in a new tab, on the passports
#              and visas section.
# Status: Active
# Labels: Regression,Shell,Profile,Passport,Document expiry
# ADO: Test Case 84116 (rev 4)
# Owner: Pini Harush
# Created: 2026-09-03
#
# Environment: PASSES on atriis-dev.app (verified 2026-09-03, 8/8 steps). NOT YET RUNNABLE on
#   atriis-stg.app: AB#65307 is merged to Atriis.App main but is not in the build staging serves —
#   its entry bundle carries no "document-expiry", no "documentExpiry" locale key and no
#   "IsDocumentExpiryRemindersEnabled" reference, and the homepage never requests that flag, while
#   an older marker ("manage-profiles") is present, which rules out a bad bundle scan. On staging
#   the scenario stops at its second step with "No document expiry warning was rendered on the
#   homepage at all". Nothing here needs changing when the release reaches staging.
#
# Preconditions (environment/data, not automatable here):
#   - Feature flag "Atriis.App.OBT.IsDocumentExpiryRemindersEnabled" is ON for both corporations.
#     document-expiry-alerts.ts returns early when it is off, so the component never renders and
#     nothing at all appears on either surface. The flag is managed remotely in the internal Atriis
#     app (feature-flags.ts keeps it out of feature-flags.<env>.json on purpose), so it cannot be
#     asserted from here.
#   - "CorpClub@comsec.com" has a passport on file whose validUntil is in the PAST (not merely
#     within 60 days — that renders "Passport expiring soon", a different title).
#   - "pini atr" is a corporate user this booker may add to a trip, and also has an already-expired
#     passport on file.
#   - The booker holds the privilege to view that traveller's profile: UserProfileV3Controller
#     withholds userPassportInfo from a booker without it, and document-expiry.logic.ts then
#     correctly evaluates no alerts — the warning would be absent for a permissions reason rather
#     than a bug in the reminder.
#
# Why the two titles differ, and why the scenario asserts both spellings:
#   getTitleKey() (document-expiry.logic.ts) resolves documentExpiry.passport.expired on the
#   traveller's own homepage and documentExpiry.passport.expiredForTraveller — "{name}'s passport
#   expired" — on the booker's trip search screen. Asserting the unnamed title on the homepage and
#   the named one on the search page is what proves the component picked the right surface; a single
#   spelling would pass against either.
#
# ADO step 2 records the observed homepage title as "ComSec AAA's passport expired". That is wrong:
# the homepage renders isBookerView=false, so the shipped title is the unnamed "Passport expired" —
# which is also what the Gherkin on the work item itself asserts, and what the app actually renders
# (a dev run on 2026-09-03 read back exactly ["Passport expired"] on the homepage and
# ["Pini Atr's passport expired"] on the trip search page). The unnamed form is used below; if the
# named form is the intended homepage behaviour, that is a product bug to raise on AB#65307 rather
# than a test to bend.
#
# The "Update Passport" click opens a new tab (utilService.openNewWindow at a desktop viewport), so
# the step that clicks it swaps the World's active page onto that tab. Everything after it runs
# against the profile, not the trip.

# ADO Test Case ID: 84116
@ado:84116
@regression @shell @profile @passport @document_expiry @tc-84116
Feature: 84116 Profile - Expired passport warning on the homepage for multi users
  As a corporate traveller who books for others
  I want an expired-passport warning for myself on the homepage and for every traveller I add to a trip
  So that no travel document derails a trip I am responsible for

  @priority:high
  Scenario: The traveller is warned about their own expired passport, and about an added traveller's
    Given I am logged in as "CorpClub@comsec.com"
    Then the "Passport expired" document expiry warning should be displayed on the homepage
    And the "Passport expired" document expiry warning should show the message "Please review and update it to avoid any disruption."
    When I book a new trip
    And I have added traveler by name "pini atr"
    Then the "Pini Atr's passport expired" document expiry warning should be displayed on the trip search page
    When I click the "Update Passport" button in the "Pini Atr's passport expired" document expiry warning
    Then the user profile of "Pini Atr" should open in a new tab on the passports and visas section
