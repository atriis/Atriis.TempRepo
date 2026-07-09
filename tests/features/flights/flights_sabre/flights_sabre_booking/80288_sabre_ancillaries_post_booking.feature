# Test Name: 76082 Sabre - Baggage and Optional services displayed after hold
# Status: Active
# Labels: Regression,Flights,Sabre,baggage,Optional Services,hold
# Owner: Noam Miller
# Created: 2026-07-01T00:00:00Z
# Updated: 2026-07-01T00:00:00Z

# ADO Test Case ID: 80288
@ado:80288
@regression @flights @sabre @baggage @hold @cancel-by-process
Feature: 80288 - Sabre - Ancillaries post booking before ticketing
  As a corporate traveler
  I want to see Baggage and Optional services in the cart once my flight is on hold
  So that I can add paid baggage and review optional services before ticketing

  Scenario: Sabre flight on hold displays Baggage and Optional services in cart
    Given I am logged in as "priceNot0@corp.frosch" booking a new trip
    And I have added a random guest traveler with phone type "Cellular phone"
    When I search for a one way flight from "LON" to "TLV" on a day that is not Friday or Saturday
    And I filter results by carrier "EL AL"
    And I add the first flight to cart
    And I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "ON HOLD"
    When I click the extras arrow button
    And the "Baggage" section should be visible in the extras
    And the "Optional services" section should be visible in the extras
    When I click to edit the baggage extras section
    And I select a paid baggage option
    And I click the save button
    And the booking status should be "ON HOLD"
    Then the visible baggage green icon should be visible
    When I click optional services in extras
    And I select a random optional service
    And I click the save button
    And the booking status should be "ON HOLD"
    Then the optional services green icon should be visible
    When I capture the "request" payload for request type "GetAncillaryOffers" from Storage
    And I capture the "request" payload for request type "UpdateReservationRQ" from Storage
    And I capture the "request" payload for request type "EnhancedEndTransactionRQ*" from Storage
    And I successfully cancel the trip
