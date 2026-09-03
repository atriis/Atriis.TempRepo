# Test Name: HYBRID for 55076 Sabre - Correct corporate profile office id is being sent when booking for guest
# Status: Active
# Labels: Regression,Sabre,Profile,Full Purchase,Flights,hybrid,guest,progress page,2026 plan 2
# Owner: Bruna Santos
# Created: 2024-12-04T09:16:56Z
# Updated: 2026-02-16T09:33:35Z

@regression @flights @sabre @full-purchase @guest @hybrid
Feature: 55076 HYBRID Sabre - Correct corporate profile office ID sent when booking for guest
  As a corporate traveler
  I want to book a flight for a guest traveler
  So that the correct corporate profile office ID is used in the booking

  Scenario: Sabre flight booking for guest uses correct corporate profile office ID
    Given I am logged in as "ericapradomeoessentialtravel@corpistestcorp.com" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "LIS" to "MIA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
