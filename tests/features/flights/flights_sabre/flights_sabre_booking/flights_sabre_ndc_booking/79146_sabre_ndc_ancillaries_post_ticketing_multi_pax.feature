# Test Name: 79146 [Flights][Sabre][NDC] - Ancillaries after ticketing, multi pax (OBT)
# Status: Draft
# Labels: Regression,Flights,Sabre,Sabre NDC,baggage,Optional Services,multi pax,ticketing,payload
# Owner: Noam Miller
# Created: 2026-08-06T00:00:00Z
# Updated: 2026-08-06T00:00:00Z

# ADO User Story: 79146
@regression @flights @sabre-ndc @baggage @multi-pax @ticketing @payload @cancel-by-process
Feature: 79146 Sabre NDC - Ancillaries after ticketing for multiple passengers
  As a corporate traveler with a ticketed multi-passenger Sabre NDC booking
  I want to see and add Baggage and Optional services in the cart
  So that each passenger can get their extras after the tickets are issued

  Scenario: Ticketed multi-pax Sabre NDC order displays and accepts Baggage and Optional services
    Given I am logged in as "ancillaryNdc@sabre.corp" booking a new trip
    And I have added a random guest traveler with phone type "Mobile"
    And I have added a random guest traveler with phone type "Mobile"
    When I search for a one way flight from "LHR" to "LIS"
    And I filter results by carrier "TP"
    Then the "NDC Direct Rate" indicator should be visible in results
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    # Sabre NDC sits on "Finalizing" right after booking; the badge is rendered from data
    # fetched on load, so it only flips to ticketed after a reload.
    And I refresh the page
    Then the quote status is "Ticketing Complete"
    When I click the extras arrow button
    Then the "Baggage" section should be visible in the extras
    And the "Optional services" section should be visible in the extras
    When I click to edit the baggage extras section
    And I select the "1st bag" baggage option for the "outbound" flight
    And I switch to baggage traveler tab 2
    And I select the "1st bag" baggage option for the "outbound" flight
    And I click the save button
    Then the quote status is "Ticketing Complete"
    And the visible baggage green icon should be visible
    When I click optional services in extras
    And I select a random optional service from "Priority fast security lane, Lounge access, Preferred boarding"
    And I switch to optional services traveler tab 2
    And I select a random optional service from "Priority fast security lane, Lounge access, Preferred boarding"
    And I click the save button
    Then the quote status is "Ticketing Complete"
    And the optional services green icon should be visible
    # Two Get Ancillaries requests are expected, one per passenger. Each assertion falls back to
    # scanning the recent payloads of this request type, so one can match the first passenger's
    # request and the other the second passenger's.
    When I capture the "request" payload for request type "Sabre NDC Get Ancillaries" from Storage
    Then the captured "request" payload for request type "Sabre NDC Get Ancillaries" should contain "1.1"
    And the captured "request" payload for request type "Sabre NDC Get Ancillaries" should contain "2.1"
    When I capture the "request" payload for request type "Sabre NDC Add Optional Services" from Storage
    And I successfully cancel the trip
