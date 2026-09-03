# Test Name: 79146 [Flights][Sabre][NDC] - Ancillaries post booking before ticketing (OBT)
# Status: Active
# Labels: Regression,Flights,Sabre,Sabre NDC,baggage,Optional Services,hold,payload
# Owner: Noam Miller
# Created: 2026-08-06T00:00:00Z
# Updated: 2026-08-06T00:00:00Z

# ADO User Story: 79146
@ado:82592
@regression @flights @sabre-ndc @baggage @hold @payload @cancel-by-process
Feature: 82592 Sabre NDC - Ancillaries post booking before ticketing
  As a corporate traveler with a Sabre NDC booking that is created but not yet ticketed
  I want to see and add Baggage and Optional services in the cart
  So that I can add paid baggage and optional services before ticketing

  Scenario: Sabre NDC order on hold displays and accepts Baggage and Optional services in cart
    Given I am logged in as "ancillaryNdc@sabre.corp" booking a new trip
    And I have added a random guest traveler with phone type "Mobile"
    When I search for a one way flight from "LIS" to "LHR"
    And I filter results by carrier "TP"
    Then the "NDC Direct Rate" indicator should be visible in results
    When I add the first flight to cart
    And I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "ON HOLD"
    When I click the extras arrow button
    Then the "Baggage" section should be visible in the extras
    And the "Optional services" section should be visible in the extras
    When I click to edit the baggage extras section
    And I select the "1st bag" baggage option for the "outbound" flight
    And I click the save button
    Then the booking status should be "ON HOLD"
    And the visible baggage green icon should be visible
    When I click optional services in extras
    And I select a random optional service from "Priority fast security lane, Lounge access, Preferred boarding"
    And I click the save button
    Then the booking status should be "ON HOLD"
    And the optional services green icon should be visible
    When I capture the "request" payload for request type "Sabre NDC Get Ancillaries" from Storage
    And I capture the "request" payload for request type "Sabre NDC Add Optional Services" from Storage
    And I successfully cancel the trip
