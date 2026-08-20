# Test Name: 83278 Mandate Fields - "Can view profile of other users" can edit only their own profile
# Description: A booker holding only "Can view profile of other users" must be able to fill in their own missing mandate fields, but must be blocked with the warning popup when they select another traveller whose profile is incomplete
# Status: Active
# Labels: Regression,Profile,Privileges,mandatory fields,"Can view profile of other users"
# ADO: Test Case 83278, User Story 60526
# Owner: Pini Harush
# Created: 2026-08-20
#
# Preconditions (data, not automatable here):
#   - "Date of Birth" is mandatory in Corporate Administration > Users > Mandate Fields
#   - "vvv@only.com" holds ONLY the "Can view profile of other users" privilege and has an empty Date of Birth
#   - Traveller "Shili@koko.com" has an empty Date of Birth

@regression @shell @roles @privileges @profile @mandatory-fields @us-60526 @tc-83278
Feature: 83278 Mandate Fields - "Can view profile of other users" can edit only their own profile
  As a booker who may view other profiles but only edit my own
  I want my own missing mandate fields to open for editing and another traveller's to be refused
  So that I can complete my own profile and book, while incomplete travellers stay blocked

  @priority:high
  Scenario: Booking for myself opens my own profile for editing
    Given I am logged in as "vvv@only.com" booking a new trip
    When I click to add myself as the traveler
    Then the user profile popup is displayed
    And the missing mandatory fields are marked with a red star
    And the user profile popup is editable
    And the mandatory details are missing popup is not displayed

  @priority:high
  Scenario: Booking for another traveller shows the mandatory details warning
    Given I am logged in as "vvv@only.com" booking a new trip
    When I add a traveler by name "Shili@koko.com" from the search autocomplete
    Then the mandatory details are missing popup is displayed
    And the mandatory details are missing popup states "This traveller's profile has missing details and cannot be added to the reservation."
    And the user profile popup is not displayed
