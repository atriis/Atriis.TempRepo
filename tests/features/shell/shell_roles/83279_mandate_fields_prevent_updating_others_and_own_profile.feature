# Test Name: 83279 Mandate Fields - "Prevent updating others and own profile" cannot edit own or other profiles
# Description: A booker holding "Prevent updating others and own profile" must get the warning popup for both their own incomplete profile and another traveller's, and must never be able to edit either
# Status: Active
# Labels: Regression,Profile,Privileges,mandatory fields,"Prevent updating others and own profile"
# ADO: Test Case 83279, User Story 60526
# Owner: Pini Harush
# Created: 2026-08-20
#
# Preconditions (data, not automatable here):
#   - "Date of Birth" is mandatory in Corporate Administration > Users > Mandate Fields
#   - "Prevent@update.otr" holds the "Prevent updating others and own profile" privilege and has an empty Date of Birth
#   - Traveller "Shili@koko.com" has an empty Date of Birth

@regression @shell @roles @privileges @profile @mandatory-fields @us-60526 @tc-83279
Feature: 83279 Mandate Fields - "Prevent updating others and own profile" cannot edit own or other profiles
  As a booker who may not update any profile, including my own
  I want the warning popup for both myself and another traveller with missing mandate fields
  So that nobody is edited by me and the incomplete profile has to be completed by someone else

  Background:
    Given I am logged in as "Prevent@update.otr" booking a new trip

  @priority:high
  Scenario: Prevent-update privilege - booking for myself shows the mandatory details warning instead of my profile
    When I click to add myself as the traveler
    Then the mandatory details are missing popup is displayed
    And the mandatory details are missing popup states "This traveller's profile has missing details and cannot be added to the reservation."
    And the user profile popup is not displayed

  @priority:high
  Scenario: Prevent-update privilege - booking for another traveller shows the mandatory details warning
    When I add a traveler by name "Shili@koko.com" from the search autocomplete
    Then the mandatory details are missing popup is displayed
    And the mandatory details are missing popup states "This traveller's profile has missing details and cannot be added to the reservation."
    And the user profile popup is not displayed
