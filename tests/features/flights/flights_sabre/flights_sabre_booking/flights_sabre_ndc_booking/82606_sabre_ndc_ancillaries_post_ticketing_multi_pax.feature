# Test Name: 79146 [Flights][Sabre][NDC] - Ancillaries after ticketing, multi pax (OBT)
# Status: Draft
# Labels: Regression,Flights,Sabre,Sabre NDC,baggage,Optional Services,multi pax,ticketing,payload
# Owner: Noam Miller
# Created: 2026-08-06T00:00:00Z
# Updated: 2026-08-06T00:00:00Z

# ADO User Story: 79146
@ado:82606
@regression @flights @sabre-ndc @baggage @multi-pax @ticketing @payload @cancel-by-process
Feature: 79146 Sabre NDC - Ancillaries after ticketing for multiple passengers
  As a corporate traveler with a ticketed multi-passenger Sabre NDC booking
  I want to see and add Baggage and Optional services in the cart
  So that each passenger can get their extras after the tickets are issued

  # KNOWN INFRA ISSUE — FOR DEV. The payload steps below can fail for a reason that is not a product
  # bug. GET /api/distributor-requests?tripId=<id> returns exactly 200 rows for a trip, every time,
  # and the framework pulls that whole list and filters client side with no way to page it
  # (listTripEntries in src/utils/payloadValidationClient.js). On trip 3791581 those 200 rows spanned
  # the full run, 12:19:51 to 12:31:05, yet were missing requests the Storage Viewer plainly shows:
  # the second "Sabre NDC Add Optional Services" (12:22:37) and "Sabre NDC Auto-Issue Ancillary EMD
  # (Test)" (12:22:11). So the API answers with an arbitrary 200-row slice, not the newest 200, and a
  # capture step can fail even when the OBT sent the request correctly. This affects every payload
  # assertion in the framework, not just this test. Open questions for dev: what is the row cap, in
  # what order are rows selected, and can we get paging or server-side filtering by request type and
  # time window? Suspected but unconfirmed: rowKey is a GUID, so "first 200" is effectively random.
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
    Then the quote status is "Finalizing"
    And the quote status should become "Ticketing Complete"
    When I click the extras arrow button
    Then the "Baggage" section should be visible in the extras
    And the "Optional services" section should be visible in the extras
    When I click to edit the baggage extras section
    And I capture the "request" payload for request type "Sabre NDC Get Ancillaries" from Storage
    Then the captured "request" payload for request type "Sabre NDC Get Ancillaries" should contain "orderId"
    When I select the "1st bag" baggage option for the "outbound" flight
    And I switch to baggage traveler tab 2
    And I select the "1st bag" baggage option for the "outbound" flight
    And I click the save button
    Then the quote status is "Ticketing Complete"
    And the visible baggage green icon should be visible
    When I click optional services in extras
    And I capture the "request" payload for request type "Sabre NDC Get Ancillaries" from Storage
    Then the captured "request" payload for request type "Sabre NDC Get Ancillaries" should contain "orderId"
    When I select the "Preferred boarding" optional service
    And I switch to optional services traveler tab 2
    And I select the "Preferred boarding" optional service
    And I click the save button
    Then the quote status is "Ticketing Complete"
    And the optional services green icon should be visible
    When I capture the "request" payload for request type "Sabre NDC Add Optional Services" from Storage
    Then the captured "request" payload for request type "Sabre NDC Add Optional Services" should contain "Passenger1"
    And the captured "request" payload for request type "Sabre NDC Add Optional Services" should contain "Passenger2"
    When I successfully cancel the trip
