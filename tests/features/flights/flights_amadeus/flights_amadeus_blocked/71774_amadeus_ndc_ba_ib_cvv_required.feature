# Test Name: 71774: Amadeus NDC [OBT] (BA & IB Only) - CVV required when FOP cc
# Description:
# Status: Active
# Labels: Amsalem,Amadeus NDC,FOP,credit card,Flights,Regression,Random CVV,CVV,2026 plan 2
# Owner: Noam Miller
# Created: 2025-12-21T02:06:37Z
# Updated: 2025-12-21T03:42:23Z

@regression @flights @amadeus @ndc @cvv @fop
Feature: 71774 Amadeus NDC - CVV required for BA and IB when FOP is credit card
  As a corporate traveler
  I want CVV to be required for BA and IB NDC bookings
  So that payment authorization is properly secured for these carriers

#No results for IB
  Scenario: CVV is required for Iberia NDC booking with credit card
    Given I am logged in as "cvvndc@corp.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MAD" to "BOG"
    And I filter results by carrier "IB"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the CVV field should not be displayed
    When I click to edit the card
    And I click the card "Cvv Required" checkbox
    And I save the card selection
    When I fill the credit card CVV
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Ticketing Complete"
    Then I successfully cancel the trip
