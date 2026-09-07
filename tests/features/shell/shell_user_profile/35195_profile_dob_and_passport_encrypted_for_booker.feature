# Test Name: 35195 Booker cannot see DOB and passport number - encrypted on profiles
# Description: A booker who opens ANOTHER user's profile sees the Birth Date and the passport
#              number encrypted. user-profile.ts computes isUserHasEncryptedFields purely from
#              identity ("viewing his own profile -> no fields encrypted, else -> they are"), so
#              the masking is NOT privilege-gated; the privilege only decides whether the booker
#              can reach the other profile at all.
#              Two different renderings, so two different assertions:
#                * Birth Date - personal-details-form.vue binds the app-datepicker's `format` to
#                  '*********' while the value is untouched, so the input DISPLAYS nine asterisks
#                  and no digits at all.
#                * Passport number - passport-visa-form.vue binds `:value` to
#                  utilService.getEncryptedStr(), i.e. '*********' + the last 3 characters.
# Status: Closed in ADO (rev 6, changed 2026-02-01) - kept as an active regression here
# Labels: Profile,Privileges,Regression,DOB,Passport,Encrypted fields
# ADO: Test Case 35195 (rev 6)
# Owner: Bruna Santos
# Created: 2023-08-30T13:50:15Z
# Updated: 2026-02-01T15:07:44Z
#
# Preconditions (environment/data, not automatable here - ADO step 1):
#   - "claraaguiar@ndclhclara.com" holds the "Can view profile of other users" privilege, so the
#     traveller-name link on the trip page opens Bruna Fran Santos' profile.
#   - "Bruna Fran Santos" is bookable by that user AND has a birth date and at least one passport
#     saved - with no passport row the Passports & Visas tab renders only "Add new passport" and
#     the last assertion has nothing to read.
#
# "I open the traveler profile for" opens the profile in a NEW TAB and parks it on this.activePage,
# so every step after it must be activePage-scoped. That is why the Passports & Visas step below is
# a traveler-profile variant and not the existing "...in my profile" one, which is bound to
# this.page (the trip page).
# The "on Personal Details" half of ADO step 5 needs no assertion of its own: openTravelerProfile
# already waits for the personal details form before it returns, so the birth-date read below can
# only happen on that tab.

# ADO Test Case ID: 35195
@ado:35195
@regression @shell @profile @privileges @dob @passport
Feature: 35195 Profile - DOB and passport number are encrypted for a booker
  As a booker who can view the profiles of other users
  I want another traveller's birth date and passport number to be encrypted
  So that their personal identity documents are not exposed to me

  @priority:high
  Scenario: Birth date and passport number are encrypted on another traveller's profile
    Given I am logged in as "claraaguiar@ndclhclara.com" booking a new trip
    And I have added traveler by name "Bruna Fran Santos"
    When I open the traveler profile for "Bruna Fran Santos"
    Then the birth date should be encrypted in the traveler profile
    When I open the passports and visas tab in the traveler profile
    Then the passport number should be encrypted showing only the last 3 digits
