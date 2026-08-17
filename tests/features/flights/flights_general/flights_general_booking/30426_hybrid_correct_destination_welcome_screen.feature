# Test Name: HYBRID for 30426 Correct destination in the welcome screen
# Status: Active
# Labels: Regression,Flights,hybrid,general,2026 plan 2
# Owner: Bruna Santos
# Created: 2023-05-08T02:07:18Z
# Updated: 2025-08-04T05:04:01Z

@regression @flights @general @hybrid
Feature: 30426 HYBRID Flights - Correct destination in welcome screen
  As a corporate traveler
  I want the correct destination to appear in the welcome screen
  So that I know my booking details are accurate

  Scenario: Correct destination is shown after booking a flight with connection
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "BUD" to "DUB"
    And flight results should be available
    And I filter airline results by "Lufthansa" checkbox
    And I filter results by carrier "LH"
    And I add the first flight to cart
    And I proceed to checkout
    And I click proceed button if visible
    And I complete the booking
    Then the quote destination should contain "Flight to"
