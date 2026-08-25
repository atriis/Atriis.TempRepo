# Test Name: 83279 Mandate Fields - "Prevent updating others and own profile" cannot edit own or other profiles
# Description: A booker holding "Prevent updating others and own profile" must get the warning popup for both their own incomplete profile and another traveller's, must never be able to edit either, and must be left unable to search because neither traveller is added
# Status: Active
# Labels: Regression,Profile,Privileges,mandatory fields,"Prevent updating others and own profile"
# ADO: Test Case 83279, User Story 60526
# Owner: Pini Harush
# Created: 2026-08-20
# Updated: 2026-08-24
#
# Preconditions (data, not automatable here):
#   - "Date of Birth" and "Mobile Number" are mandatory in Corporate Administration > Users > Mandate Fields
#   - "Prevent@update.otr" holds the "Prevent updating others and own profile" privilege and has an empty Date of Birth
#   - Traveller "Shili@koko.com" has an empty Date of Birth

@regression @shell @roles @privileges @profile @mandatory-fields @us-60526 @tc-83279
Feature: 83279 Mandate Fields - "Prevent updating others and own profile" cannot edit own or other profiles
  As a booker who may not update any profile, including my own
  I want the warning popup for both myself and another traveller with missing mandate fields
  So that nobody is edited by me and the incomplete profile has to be completed by someone else

  @priority:high
  Scenario: Prevent-update privilege - booking for myself shows the mandatory details warning instead of my profile
    Given I am logged in as "Prevent@update.otr" booking a new trip
    When I click to add myself as the traveler
    Then the mandatory details are missing popup is displayed
    And the mandatory details are missing popup states "This traveller's profile has missing details and cannot be added to the reservation."
    And the user profile popup is not displayed
    And the search is blocked because no traveler was added to the trip

  @priority:high
  Scenario: Prevent-update privilege - booking for another traveller shows the mandatory details warning
    Given I am logged in as "Prevent@update.otr" booking a new trip
    When I add a traveler by name "Shili@koko.com" from the search autocomplete
    Then the mandatory details are missing popup is displayed
    And the mandatory details are missing popup states "This traveller's profile has missing details and cannot be added to the reservation."
    And the user profile popup is not displayed
    And the search is blocked because no traveler was added to the trip

  # ADO 83279's closing step - "the popup wording is identical for my own profile and for another
  # traveller". Both popups have to be seen in one flow to be compared, so this scenario walks the
  # two selections in sequence rather than asserting the same literal twice in isolation.
  @priority:medium
  Scenario: Prevent-update privilege - the warning wording is identical for my own profile and for another traveller
    Given I am logged in as "Prevent@update.otr" booking a new trip
    When I click to add myself as the traveler
    Then the mandatory details are missing popup is displayed
    When I remember the mandatory details are missing popup wording
    And I close the mandatory details are missing popup
    And I add a traveler by name "Shili@koko.com" from the search autocomplete
    Then the mandatory details are missing popup is displayed
    And the mandatory details are missing popup wording is identical to the one remembered earlier
