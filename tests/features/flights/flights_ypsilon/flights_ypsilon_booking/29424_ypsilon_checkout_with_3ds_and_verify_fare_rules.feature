# Test Name: 29424 Ypsilon> checkout with 3ds and Verify that the terms/fare rules are loading in results, cart and checkout
# Description:
# Status: Active
# Labels: Regression,No Amadeus Hotel Book,Ypsilon,Sanity,Pre Prod,Flights,Keeps failing,2026 plan 1
# Owner: Noam Miller
# Created: 2023-06-20T08:37:34Z
# Updated: 2025-12-11T05:45:13Z

@regression @flights @ypsilon @sanity @full-purchase @3ds @fare-rules
Feature: 29424 Ypsilon - Checkout with 3DS and verify fare rules loading in results, cart and checkout
  As a corporate traveler using Ypsilon
  I want to verify that fare rules load correctly in results, cart, and after checkout
  So that I can review terms before and after booking with 3DS card verification

  Scenario: Checkout with 3DS and validate fare rules in results, cart and after booking
    Given I am logged in as "ypsilonReg@corp.club" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MIL"
    And flight results should be available
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I fill credit card cvv if needed
    And I proceed to checkout
    When I complete the booking with Ypsilon credit card verification
    Then the booking status should be "Ticketing Complete"
    When I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
