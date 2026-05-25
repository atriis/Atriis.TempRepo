# Test Name: 41113 (merged) Manual Quote - flight, hotel, car
# Status: Active
# Labels: Manual Quote,Regression,Fare Rules,No Amadeus Hotel Book,Club,Flights,Cars,Hotel,Pre Prod,merge,Giata,2026 plan 1
# Owner: Noam Miller
# Created: 2024-01-10T12:55:45Z
# Updated: 2025-10-27T09:35:50Z
@regression @manual_quote
Feature: Manual Quote - Flight, Hotel and Car manual quotes in one trip
  As a corporate traveler
  I want to add flight, hotel and car manual quotes in a single trip and complete booking
  So that I can manage mixed manual-quote trips end to end

  @priority:critical
  Scenario: Add flight, hotel and car manual quotes, validate cart, checkout and cancel
    Given I am logged in as "manualQuote@testim.com" booking a new trip
    And I have added myself as the traveler
    # TODO: New step + DSL — ManualQuoteSearch.addOneWayFlightManualQuote(page, { from, to, carrier:'EL AL', flightNumber:'LY1235', base:1, tax:20, changeFee:5 })
    When I add a one-way flight manual quote from "LON" to "MAD"
    # TODO: New step + DSL — Cart.expectTitleText(page, 'Trip overview') (or reuse existing Cart assertion)
    Then the cart should display "Trip overview"
    # TODO: New step + DSL — ManualQuoteSearch.addHotelManualQuote(page, { city, confirmation, roomDescription, base, tax, cancellation:'48HRS Prior to Arrival' })
    When I add a hotel manual quote in "Portland" with confirmation number "34478316577" room description "standard double" base "78" tax "36"
    Then the cart should display "Trip overview"
    # TODO: New step + DSL — ManualQuoteSearch.addCarManualQuote(page, { from, to, supplier, mileage:'no limitation', confirmation, base, tax })
    When I add a car manual quote from "PDX" to "SFO" with supplier "avis" confirmation "966231A" base "60" tax "24"
    # TODO: New step + DSL — ManualQuoteCart.expectCarQuoteDetails(page, { subtotal, pickup, dropoff }) (open more-details drawer, assert rows incl. Confirmation Number)
    Then the car manual quote in cart should show subtotal "$84.00" and pickup "portland,or,usa,(pdx)" and dropoff "san francisco,ca,usa,(sfo)"
    # TODO: New step + DSL — ManualQuoteCart.expectFlightQuoteDetails(page, { carrier, from, to, flightNumber, amount })
    And the flight manual quote in cart should show carrier "EL AL" route "LON" to "MAD" flight number "LY1235" and amount "$26.00"
    # TODO: New step + DSL — ManualQuoteCart.expectFlightPriceBreakdown(page, { base, tax, changeFee, subtotal })
    And the flight manual quote price breakdown should show base "$1.00" tax "$20.00" change fee "$5.00" subtotal "$26.00"
    # TODO: New step + DSL — ManualQuoteCart.expectHotelQuoteDetails(page, { confirmation, room, cancellation, amount })
    And the hotel manual quote in cart should show confirmation "34478316577" room "standard double" cancellation "48HRS Prior to Arrival" amount "$114.00"
    # TODO: New step + DSL — ManualQuoteCart.expectCartSummary(page, { hotel, car, flight, total }) (.quote-summary-list amounts)
    And the cart summary should show hotel "$114.00" car "$84.00" flight "$26.00" total "$224.00"
    When I proceed to checkout
    And I complete the booking
    # TODO: Reuses ManualQuoteCart.expectCarQuoteDetails after checkout
    Then the car manual quote in cart should show subtotal "$84.00" and pickup "portland,or,usa,(pdx)" and dropoff "san francisco,ca,usa,(sfo)"
    # TODO: Reuses ManualQuoteCart.expectFlightQuoteDetails after checkout
    And the flight manual quote in cart should show carrier "EL AL" route "LON" to "MAD" flight number "LY1235" and amount "$26.00"
    # TODO: Reuses ManualQuoteCart.expectFlightPriceBreakdown after checkout
    And the flight manual quote price breakdown should show base "$1.00" tax "$20.00" change fee "$5.00" subtotal "$26.00"
    # TODO: Reuses ManualQuoteCart.expectHotelQuoteDetails after checkout
    And the hotel manual quote in cart should show confirmation "34478316577" room "standard double" cancellation "48HRS Prior to Arrival" amount "$114.00"
    # TODO: New step + DSL — ManualQuoteCart.expectCartSummaryAfterCheckout(page, { flight, car, hotel }) (.flight-quote-card / .car-quote-card / .last-quote amounts)
    And the cart summary should show flight "$26.00" car "$84.00" hotel "$114.00" after checkout
    Then I successfully cancel the trip
