# Test Name: 83278 Mandate Fields - 'Can view profile of other users' can edit only their own profile
# Description: A booker holding only "Can view profile of other users" must be able to fill in their own
#              missing mandate fields, must be blocked with the warning popup when they select an incomplete
#              traveller, and must get a read-only profile popup for a traveller they may only view
# Status: Active
# Labels: Regression,Profile,Privileges,mandatory fields,"Can view profile of other users"
# ADO: Test Case 83278 (rev 8), User Story 60526
# Owner: Pini Harush
# Created: 2026-08-20
# Updated: 2026-08-24 — reconciled against TC 83278 rev 8
#
# Preconditions (data, not automatable here):
#   - "Date of Birth" and "Mobile Number" are mandatory in Corporate Administration > Users > Mandate Fields
#   - "vvv@only.com" holds ONLY the "Can view profile of other users" privilege and has an empty Date of Birth
#   - Traveller "Shili@koko.com" has an empty Date of Birth
#   - Traveller "mimi@lolo.pof" has a complete profile this booker may view but not edit
#
# The three traveller selections run in one continuous session on purpose: TC rev 8 dropped the
# "start a new trip" steps between them, and the own-profile Date of Birth is deliberately left
# unsaved, so the state carried between selections is part of what is under test.

@regression @shell @roles @privileges @profile @mandatory-fields @us-60526 @tc-83278 @ado:83278
Feature: 83278 Mandate Fields - 'Can view profile of other users' can edit only their own profile
  As a booker who may view other profiles but only edit my own
  I want my own missing mandate fields to open for editing, an incomplete traveller to be refused,
  and another traveller's profile to open read-only
  So that I can complete my own profile and book, while other travellers' details stay protected

  @priority:high
  Scenario: Can view profile of other users - the user can edit only their own profile
    Given I am logged in as "vvv@only.com" booking a new trip

    When I click to add myself as the traveler
    Then the user profile popup is displayed
    And the user profile popup opens on the "personalDetails" tab
    And the "Date of Birth" field is marked with a red star
    And the user profile popup is editable
    And the mandatory details are missing popup is not displayed
    When I close the user profile popup
    And I add a traveler by name "Shili@koko.com" from the search autocomplete
    Then the mandatory details are missing popup is displayed
    And the mandatory details are missing popup states "profile has missing details and cannot be added to the reservation."
    And the user profile popup is not displayed
    When I close the mandatory details are missing popup
    And I add a traveler by name "mimi@lolo.pof" from the search autocomplete
    And I click the traveler name on the search page
    Then the traveler profile page is displayed
    And the traveler profile page is not editable
