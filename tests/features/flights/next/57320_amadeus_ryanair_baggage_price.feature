# Test Name: 57320 Amadeus - Ryanair - Price is correct after adding baggage
# Description:
# Status: Active
# Labels: Amadeus,Flights,Ryanair,Regression,baggage,price,Cart,GDS,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-14T06:56:52Z
# Updated: 2026-02-16T10:28:35Z

@regression @flights @amadeus @ryanair @baggage @price
Feature: 57320 Amadeus Ryanair - Price correct after adding baggage
  As a corporate traveler
  I want the total price to be correct after adding baggage to a Ryanair flight
  So that I am not overcharged for baggage

  Scenario: Cart price updates correctly after adding baggage to Ryanair flight
    Given I am logged in as "bruna_nlgov" booking a new trip
    And I have added myself as the traveler
    # TODO: Search one-way flight on a Thursday (specific day logic)
    # Testim: Search_flights_one_way___thursday('BUD', 'DUB')
    # The Thursday date logic may need a new DSL helper
    When I search for a one way flight from "BUD" to "DUB"
    And I click proceed on the reference fields popup
    And I wait for add to trip text to be visible
    And I filter results by carrier "Ryanair"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I extract the price at index 0 from "cart"
    # TODO: Open baggage panel and add baggage option
    # Testim: clicks ".flight-baggage .is-clickable" → waits for route (BUD) →
    # clicks SVG icon to open baggage → selects option from dropdown → clicks save
    # Need new steps: When I open the baggage panel
    #                 And I add the first baggage option
    Then the booking status should be "Pending booking"
    When I extract the price at index 1 from "cart"
    # TODO: Validate price before + baggage = price after
    # Testim: Check_if_price_before_and_after_adding_baggage_makes_sense(beforeBaggage, afterBaggage)
    # Can use: Then the extracted price at index 1 should be greater than the extracted price at index 0
    Then I successfully cancel the trip
