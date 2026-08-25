# Test Name: 83280 Mandate Fields - 'Can edit and view profile for other users' can view and edit own and other profiles
# Description: The control case of US 60526 - a booker holding "Can edit and view profile for other users"
#              must keep the pre-fix behaviour: the editable profile popup opens both for their own
#              incomplete profile and for an incomplete traveller, and the warning popup is never raised
# Status: Active
# Labels: Regression,Profile,Privileges,mandatory fields,"Can edit and view profile for other users"
# ADO: Test Case 83280 (rev 8), User Story 60526
# Owner: Pini Harush
# Created: 2026-08-24
#
# Preconditions (data, not automatable here):
#   - "Date of Birth" and "Mobile Number" are mandatory in Corporate Administration > Users > Mandate Fields
#   - "Can@edit.profiles" holds the "Can edit and view profile for other users" privilege and has an empty Date of Birth
#   - Traveller "Shili@koko.com" has an empty Date of Birth
#
# This is the positive counterpart of 83278/83279: the same two traveller selections that raise the
# "Mandatory Details Are Missing" warning for a view-only or prevent-update booker must instead open
# the editable popup here. Asserting the warning's ABSENCE after each selection is what makes this a
# control case rather than a happy path - it is the assertion that fails if the mandate-fields fix
# ever over-reaches and starts blocking a booker who is allowed to edit.
#
# Both selections run in one continuous session on purpose: TC rev 8 has a single "start a new trip",
# and the Date of Birth is deliberately filled but NOT saved ("I can fill (don't save)"), so the state
# carried from the own-profile popup into the traveller selection is part of what is under test.

@regression @shell @roles @privileges @profile @mandatory-fields @us-60526 @tc-83280 @ado:83280
Feature: 83280 Mandate Fields - 'Can edit and view profile for other users' can view and edit own and other profiles
  As a booker who may view and edit other travellers' profiles
  I want the editable profile popup to open for my own incomplete profile and for an incomplete traveller
  So that the privilege keeps behaving exactly as it did before the mandate-fields fix

  @priority:high
  Scenario: Can edit and view profile for other users - the user can view and edit their own and other profiles
    Given I am logged in as "Can@edit.profiles" booking a new trip

    When I click to add myself as the traveler
    Then the user profile popup is displayed
    And the user profile popup opens on the "personalDetails" tab
    And the "Date of Birth" field is marked with a red star
    And the user profile popup is editable
    And the mandatory details are missing popup is not displayed

    When I close the user profile popup
    And I add a traveler by name "Shili@koko.com" from the search autocomplete
    Then the user profile popup is displayed for "Shili@koko.com"
    And the mandatory details are missing popup is not displayed
    And the "Date of Birth" field is marked with a red star
    And the user profile popup is editable
