# Test Name: 13030 Ypsilon - The seat map is displayed for Transavia France (TO), and the selected seat is successfully added
# Status: Active
# Labels: Ypsilon,Flights,Regression,Seating,specific,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-04-16T04:56:43Z
# Updated: 2025-07-15T10:50:40Z

@regression @flights @ypsilon @seating @transavia @priority:high
Feature: 13030 Ypsilon Transavia France - Seat map displayed and seat successfully added
  As a corporate traveler booking a Transavia France flight via Ypsilon
  I want the seat map to be displayed and to add an available seat
  So that my seat preference is recorded with the booking

  Scenario: Seat map is displayed for Transavia France Ypsilon flight and selected seat is added
    Given I am logged in as "ypsilon@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "ORY" to "BCN"
    Then flight results should be available
    When I filter results by carrier "TO"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
    And I select the first available flight seat
    And I save and close seat map drawer
    Then I should see a success notification