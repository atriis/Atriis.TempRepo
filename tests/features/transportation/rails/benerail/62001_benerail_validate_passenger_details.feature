# Test Name: 62001 Benerail - validate passenger details
# Description: Validate passenger details
# Status: Active
# Labels: Full Purchase,Daily Transportation,Regression,Benerail Moove Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-05-08T02:15:02Z
# Updated: 2026-02-06T03:27:06Z
@wip @transportation @rails @benerail @regression @priority:critical
Feature: 62001 Benerail - Passenger details validation for multiple travelers
  As a corporate traveler booking for multiple passengers
  I want to see the passenger details panel correctly populated in Benerail results
  So that I can confirm each traveler's information before adding to cart

 #Incomplete test, check testim to finish it
  Scenario: Benerail passenger details are correctly displayed for three travelers
    Given I am logged in as "testim@benemoove.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Secbene Moove"
    When I wait for the traveler name to be displayed
    And I have added a guest traveler named "David Kohler" with email "davidkohler@atriistech.com"
    When I search for a one way Benerail train from "bebmiToNlasc"
    And I add a Benerail one way to the trip
    And the booking status should be "Pending booking"
    And I click the proceed to checkout button
    Then the proceed to checkout button should be disabled
    Then passenger info is displayed 3/3 with a green checkmark
    When I click to edit passenger info
    Then I click "Bene Moove" passenger to validate that email is "testim@benemoove.com", last name is "Moove" and first name is "Bene"
    And I click "David Kohler" passenger to validate that email is "davidkohler@atriistech.com", last name is "Kohler" and first name is "David"
    When I remove passenger info email from "David Kohler"
    And I click the save button
    Then passenger info email field is mandatory - border gets red
    When I add the passenger info email "davidkohler@atriistech.com" to the passenger "David Kohler"
    And I click the save button
    And the booking status should be "Pending booking"
    When I click to edit passenger info
    And I click "Secbene Moove" passenger to validate that email is "testimsec@benemoove.com", last name is "Moove" and first name is "Secbene"
    And I click the save button
    And the booking status should be "Pending booking"
    Then passenger info is displayed 3/3 with a green checkmark
    When I delete "Secbene Moove" corporate user from cart page
    And I add guest traveller from cart named "Ellen Murphy" with email "ellen@atriistech.com"
    When I click to edit passenger info
    Then I click "Ellen Murphy" passenger to validate that email is "ellen@atriistech.com", last name is "Murphy" and first name is "Ellen"
    And I click the save button
    And the booking status should be "Pending booking"
    And I proceed to checkout
    Then I wait for booking details in checkout