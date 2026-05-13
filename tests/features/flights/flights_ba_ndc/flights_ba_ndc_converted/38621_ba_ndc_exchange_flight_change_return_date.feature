# Test Name: 38621 Exchange in BA
# Description:
# Status: Active
# Labels: exchange,Flights,Full Purchase,price,BA NDC Regression,progress page,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-05-30T01:10:50Z
# Updated: 2025-09-30T12:46:12Z

@regression @flights @ndc @ba @exchange @full-purchase
Feature: 38621 BA NDC - Exchange flight (return date change)

  As a corporate traveler
  I want to change the return date of a booked BA NDC flight
  So that I can verify the exchange/reissue flow works with correct price validation

  Scenario: Exchange BA NDC flight by changing the return date
    Given I am logged in as "brit@indecy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LHR" to "MAD"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    # TODO: verify origin is "LHR", destination is "MAD", extract price and departure date for later comparison
    # TODO: implement step — 'I click the change flight button from the trip dropdown'
    #   Open the trip dropdown menu and click the "Change flight" option to initiate the exchange flow
    When I click the change flight button from the trip dropdown
    # TODO: implement step — 'I select the return segment and change the return date'
    #   In the exchange/reissue UI, select the return segment and pick a new return date
    And I select the return segment and change the return date
    # TODO: validate new flight selection screen (routes LHR→MAD→MAD→LHR, new price extraction) and proceed
    # TODO: implement step — 'I proceed with the new flight selection'
    #   Confirm the new flight selection in the exchange modal and continue to the reissue cart
    When I proceed with the new flight selection
    Then the booking status should be "Pending Reissue"
    # TODO: validate cart details (routes, dates, original price, new price, total price: original + new = total)
    # TODO: validate price breakdown (original, new, total)
    # TODO: implement step — 'I reissue the flight'
    #   Click the Reissue/Confirm reissue button and wait for the booking to complete
    When I reissue the flight
    # TODO: validate cart details after reissue
    # TODO: validate price breakdown after reissue
