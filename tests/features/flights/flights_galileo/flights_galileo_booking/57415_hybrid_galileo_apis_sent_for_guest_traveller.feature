# Test Name: HYBRID for 57415 Galileo - APIS is being sent when booking for a guest traveller
# Status: Active
# Labels: hybrid,Galileo,APIS,Flights,guest,Regression,progress page,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-26T04:40:41Z
# Updated: 2026-01-19T07:52:25Z

@regression @galileo @flights @apis @guest @hybrid
Feature: 57415 Galileo - APIS sent when booking for guest traveller

  As a corporate traveler
  I want APIS data to be sent when booking for a guest traveller
  So that passport information is transmitted correctly

  Scenario: Guest traveller booking sends APIS data
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LHR" to "NYC"
    And I add the first flight to cart
    Then the booking status should be "Pending Booking"
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"

