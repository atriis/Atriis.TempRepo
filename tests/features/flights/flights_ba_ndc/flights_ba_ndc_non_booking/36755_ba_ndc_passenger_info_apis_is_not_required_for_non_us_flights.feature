# Test Name: 36755 BA NDC - Passenger Info (APIS) is not required in case flight is not to the United States
# Description:
# Status: Active
# Labels: BA NDC Regression,APIS,Flights,Search Flight,Cart,passenger info,guest,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-04-17T09:34:38Z
# Updated: 2025-04-17T09:53:11Z

@regression @flights @ndc @ba @apis
Feature: 36755 BA NDC - Passenger Info (APIS) is not required for non-US flights

  As a corporate traveler
  I want to book a BA NDC flight to a non-US destination
  So that I can verify APIS passenger info is not required for non-US routes

  Scenario: APIS section is not shown in cart for non-US BA NDC flight
    Given I am logged in as "iancurtis@ndcba.com" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "LHR" to "ARN"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the passenger info section should not be visible in the extras
    Then the "Frequent Flyer" section should be visible in the extras
    Then the "Seating" section should be visible in the extras