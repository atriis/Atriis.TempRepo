# Test Name: Hybrid for 69588: Sabre booking with paid baggage
# Status: Active
# Labels: Gray Dawes,Flights,baggage,Sabre,Search Flight,Pricing Options,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-10-29T06:10:43Z
# Updated: 2026-01-19T03:20:27Z

@regression @flights @sabre @baggage @hybrid @cancel-by-process
Feature: 69588 Sabre - Booking with paid baggage
  As a corporate traveler
  I want to book a flight with paid baggage
  So that my baggage is included in the booking

  # TODO: This test has complex baggage selection flow that needs new DSL steps
  Scenario: Sabre flight booking with paid baggage is successful
    Given I am logged in as "corpwithbag" booking a new trip
    And I have added a random guest traveler
    # TODO: The Testim test uses a custom search function - need to verify route/params
    When I search for a one way flight from "DFW" to "IAH"
    And flight results should be available
    # TODO: Step needed: "When I select the fare with baggage" (selects fare with baggage option from pricing)
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    # TODO: Step needed: "When I select baggage option in cart" (paid baggage selection)
    When I proceed to checkout
    And I complete the booking
    Then I successfully cancel the trip
