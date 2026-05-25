# Test Name: 35770 Manual quote - Possible to add manual quotes from already existing trip
# Status: Active
# Labels: Manual Quote,No Amadeus Hotel Book,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-09-12T01:55:25Z
# Updated: 2025-10-21T11:33:47Z
@regression @manual_quote
Feature: Manual Quote - Add manual quote to an already existing trip
  As a corporate traveler
  I want to add a flight manual quote to a trip that already contains a hotel
  So that I can mix real bookings with manual quotes in the same trip

  @priority:critical
  Scenario: Add a flight manual quote after a hotel has been added to the cart
    Given I am logged in as "camilacoelho@manualquotetravelpolicy.com" booking a new trip
    And I have added myself as the traveler
    # TODO: New step + DSL — HotelSearch.searchHotelsByNights(page, location, nights) (1-night calendar selection in LHR)
    When I search for a 1 night hotel in "LHR"
    # TODO: New step + DSL — HotelLevelResults.addHotelByIndex(page, 3) (click 3rd hotel 'Choose' — refundable NOT filtered in this Testim test)
    And I add the third hotel from the search results to the cart
    Then the booking status should be "Pending booking"
    # TODO: New step + DSL — ManualQuoteSearch.openManualQuotePage(page) (click .is-capitalized manual-quote entry point)
    When I navigate to the Manual Quote page
    # TODO: New step + DSL — ManualQuoteSearch.addOneWayFlightManualQuote(page, { from, to, carrier:'EL AL', flightNumber:'LY1235', base:1, tax:20, changeFee:5 })
    And I add a one-way flight manual quote from "LON" to "MAD"
    Then the booking status should be "On hold"
    Then I successfully cancel the trip
