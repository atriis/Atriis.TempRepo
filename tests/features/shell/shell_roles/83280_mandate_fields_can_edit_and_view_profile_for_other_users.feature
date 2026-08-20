# Test Name: 83280 Mandate Fields - "Can edit and view profile for other users" can view and edit own and other profiles
# Description: Control case - a booker holding "Can edit and view profile for other users" must keep the pre-fix behaviour: the editable profile popup opens for their own profile and for another traveller, and the warning popup is never raised
# Status: Active
# Labels: Regression,Profile,Privileges,mandatory fields,"Can edit and view profile for other users"
# ADO: Test Case 83280, User Story 60526
# Owner: Pini Harush
# Created: 2026-08-20
#
# Preconditions (data, not automatable here):
#   - "Date of Birth" is mandatory in Corporate Administration > Users > Mandate Fields
#   - "Can@edit.profiles" holds the "Can edit and view profile for other users" privilege and has an empty Date of Birth
#   - Traveller "Shili@koko.com" has an empty Date of Birth

@regression @shell @roles @privileges @profile @mandatory-fields @us-60526 @tc-83280
Feature: 83280 Mandate Fields - "Can edit and view profile for other users" can view and edit own and other profiles
  As a booker who may view and edit other profiles
  I want the editable profile popup for my own profile and for another traveller
  So that the privilege keeps behaving exactly as it did before the mandate-fields fix

  @priority:high
  Scenario: Booking for myself opens my own profile for editing
    Given I am logged in as "Can@edit.profiles" booking a new trip
    When I click to add myself as the traveler
    Then the user profile popup is displayed
    And the missing mandatory fields are marked with a red star
    And the user profile popup is editable
    And the mandatory details are missing popup is not displayed

  @priority:high
  Scenario: Booking for another traveller opens the traveller profile for editing
    Given I am logged in as "Can@edit.profiles" booking a new trip
    When I add a traveler by name "Shili@koko.com" from the search autocomplete
    Then the user profile popup is displayed
    And the missing mandatory fields are marked with a red star
    And the user profile popup is editable
    And the mandatory details are missing popup is not displayed
