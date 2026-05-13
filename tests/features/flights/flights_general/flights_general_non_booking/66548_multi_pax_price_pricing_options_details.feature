# Test Name: 66548 Multi Pax - Correct price in pricing options and Flight Details
# Status: Active
# Labels: Club,price,Pricing Options,Flight Details,Regression,Sabre,2026 plan 2
# Owner: Noam Miller
# Created: 2025-09-07T12:13:57Z
# Updated: 2026-01-06T01:01:24Z

@regression @flights @general @multi-pax @pricing-options @sabre
Feature: 66548 Multi Pax - Correct price in pricing options and flight details
  As a corporate traveler booking for multiple passengers
  I want to see the correct per-traveler price in pricing options and total in flight details
  So that I can verify the pricing is accurate

  Scenario: Multi pax pricing is correct in pricing options and flight details
    Given I am logged in as "sabre@testim.com" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "LON" to "MAD"
    Then flight results should be available
    And I click to open first pricing options
    And I extract the price from first pricing option
    Then the price in pricing options should be per traveler
    Then I close pricing options modal
    When I click to open flight details
    And I extract the total price from flight details
    Then the price in flight details should be total for all pax
