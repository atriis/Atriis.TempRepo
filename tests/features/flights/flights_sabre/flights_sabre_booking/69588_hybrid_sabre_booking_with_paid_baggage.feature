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

  Scenario: Sabre flight booking with paid baggage is successful
    Given I am logged in as "corpwithbag" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "MEL" to "SYD"
    And flight results should be available
    And I filter results by carrier "Qantas"
    And I click to open first pricing options
    And I select the first option from pricing options
    Then I should see the heading "Flight To Melbourne"
    And I select the first option from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    When I select the "Extra 5kg" baggage option for the "outbound" flight
    And I select the "Extra 10kg" baggage option for the "inbound" flight
    And I click the save button
    When I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
