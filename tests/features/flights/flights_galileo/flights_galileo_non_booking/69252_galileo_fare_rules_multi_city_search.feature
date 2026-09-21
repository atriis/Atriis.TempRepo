# Test Name: 69252 Galileo - Flights - Fare rules displayed in Multi City search
# Status: Active
# Labels: Fare Rules,Regression,Flights,Pricing Options,multi city,Galileo,additional pricing options,Cart,results,Flight Details,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-24T02:11:37Z
# Updated: 2025-10-24T05:13:35Z

@regression @provider:galileo @flights @fare_rules @multi_city @pricing_options @priority:high
Feature: 69252 Galileo - Fare rules displayed in multi-city search

  As a corporate traveler
  I want fare rules to be displayed for each leg in a multi-city search
  So that I can review policies per segment

  Scenario: Fare rules visible in results, pricing options, flight details and cart for multi-city
    Given I am logged in as "bsgalileoflight@galileoflight.com" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "IAH-DFW, MIA-IAH, ORD-IAH"
    And flight results should be available
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the third flight leg
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I click to open flight details
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the third flight leg
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    When I click to open first pricing options
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I select the first option from pricing options
    Then I should see the heading "Flight To Houston"
    When I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I select the first option from pricing options
    Then I should see the heading "Flight To Houston"
    When I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    Then I close pricing options modal
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the third flight leg
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I click to open flight details
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the third flight leg
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    When I click to open price breakdown in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I click fare rules for the third flight leg
    Then I should see the fare rules note about strictest terms
