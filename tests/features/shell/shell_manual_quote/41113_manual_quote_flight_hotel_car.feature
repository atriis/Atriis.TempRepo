# Test Name: 41113 (merged) Manual Quote - flight, hotel, car
# Status: Active
# Labels: Manual Quote,Regression,Fare Rules,No Amadeus Hotel Book,Club,Flights,Cars,Hotel,Pre Prod,merge,Giata,2026 plan 1
# Owner: Noam Miller
# Created: 2024-01-10T12:55:45Z
# Updated: 2025-10-27T09:35:50Z
@regression @manual_quote
Feature: 41113 Manual Quote - Flight, Hotel and Car manual quotes in one trip
  As a corporate traveler
  I want to add flight, hotel and car manual quotes in a single trip and complete booking
  So that I can manage mixed manual-quote trips end to end

  @priority:critical
  Scenario: Add flight, hotel and car manual quotes, validate cart, checkout and cancel
    Given I am logged in as "manualQuote@testim.com" booking a new trip
    And I have added myself as the traveler
    And I add a flight manual quote from "LON" to "MAD"
    And the booking status should be "On hold"
    And I navigate to the manual quote search page from the cart
    And I add a hotel manual quote in "Portland" for 1 room
    And the booking status should be "On hold"
    And I navigate to the manual quote search page from the cart
    And I add a car manual quote with pick up in "Portland" and drop off in "San Francisco"
    And the booking status should be "On hold"
    # Price validation: flight baseFare=$10, hotel baseFare=$10, car baseFare=$60 + tax=$10 = $70
    Then the "Flight to" quote card should show a price of 10 dollars
    And the "Test Hotel" quote card should show a price of 10 dollars
    And the "Car Rental" quote card should show a price of 70 dollars
    # Flight drawer: carrier="TAP Air Portugal (TP)", flight number="765"
    When I click more details for the "Flight to" quote in cart
    Then the more details should show "TAP Air Portugal"
    And the more details should show "765"
    And I close the open drawer
    # Hotel drawer: hotelName="Test Hotel", roomDescription="Standard double", address="123 Main St"
    When I click more details for the "Test Hotel" quote in cart
    Then the more details should show "Test Hotel"
    And the more details should show "Standard double"
    And the more details should show "123 Main St"
    And I close the open drawer
    # Car drawer: carClass="Mini Elite", cancellationPolicy="No limitation", confirmationNumber="966231A"
    When I click more details for the "Car Rental" quote in cart
    Then the more details should show "Mini Elite"
    And the more details should show "No limitation"
    And the more details should show "966231A"
    And I close the open drawer
    And I click the proceed to checkout button
    And I complete the booking
    Then I successfully cancel the trip

