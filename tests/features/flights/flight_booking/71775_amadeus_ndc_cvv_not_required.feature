# Test Name: Test Case 71775: Amadeus NDC [OBT] (all carriers except BA & IB) - CVV not required when FOP credit card
# Description: Clone
# Status: Active
# Labels: Amsalem,Amadeus NDC,FOP,credit card,Flights,Regression,Random CVV,CVV,2026 plan 2
# Owner: Noam Miller
# Created: 2025-12-22T05:24:10Z
# Updated: 2025-12-22T06:26:09Z

@regression @flights @amadeus @ndc @cvv @fop
Feature: 71775 Amadeus NDC - CVV not required for non-BA/IB carriers
  As a corporate traveler
  I want CVV to not be required for non-BA/IB NDC bookings
  So that payment is seamless for carriers that don't need CVV

  Scenario: CVV not required for AA NDC booking with credit card
   Given I am logged in as "cvvndc" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LGA" to "CLT"
    And I filter results by carrier "AA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the CVV field should not be displayed
    When I click to edit the card
    And I click the card "Cvv Required" checkbox
    And I save the card selection
    Then the CVV field should not be displayed
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
  