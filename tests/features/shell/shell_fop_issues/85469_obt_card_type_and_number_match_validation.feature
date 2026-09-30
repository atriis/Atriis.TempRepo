# Test Name: 85469 OBT – Card Type and Number Match Validation
# Status: Design
# Labels: Flights,FOP,Regression
# Owner: Yael Alef
# Created: 2026-09-27T05:39:41Z

@regression @flights @fop 
Feature: 85469 OBT – Card Type and Number Match Validation
  As a corporate traveler adding a payment method in the cart
  I want to be told when the number I typed does not match the AirPlus card type
  So that I do not save a card with the wrong type

  Scenario: Non-AirPlus card number shows a type mismatch message in the card number popup
    Given I am logged in as "brunasantosnl@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    When I click add payment method button
    And I click add card details button
    And I select card type as "Air Plus" in card details drawer
    And I click insert credit card number
    And I insert credit card number "4580458045804580"
    And I click save button
    Then I should see message "This doesn't look like an AirPlus number. Check the number or change the card type."
