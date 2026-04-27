# Test Name: 69252 Galileo - Flights - Fare rules displayed in Multi City search
# Status: Active
# Labels: Fare Rules,Regression,Flights,Pricing Options,multi city,Galileo,additional pricing options,Cart,results,Flight Details,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-24T02:11:37Z
# Updated: 2025-10-24T05:13:35Z

@regression @galileo @flights @fare_rules @multi_city @pricing_options
Feature: 69252 Galileo - Fare rules displayed in multi-city search

  As a corporate traveler
  I want fare rules to be displayed for each leg in a multi-city search
  So that I can review policies per segment

  Scenario: Fare rules visible in results, pricing options, flight details and cart for multi-city
    Given I am logged in as "bsgalileoflight" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "IAH-DFW" and "MIA-IAH" and "ORD-IAH"
    And flight results should be available
    # Fare rules in results — with tabs for each leg
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I should click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I should click fare rules for the third flight leg
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    # TODO: Flight___Fare_Rules___Pricing_Options — open pricing options, open fare rules inside, verify per leg
    # TODO: Flight___Results___Flight_Details — open flight details, open fare rules inside, verify per leg
    # Add to cart
    And I add the first flight to cart
    # Fare rules in cart — same multi-leg verification
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I should click fare rules for the second flight leg
    Then I should see the fare rules note about strictest terms
    When I should click fare rules for the third flight leg
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    # TODO: Flight___Fare_Rules___Price_Breakdown_in_cart — disabled (if(true) return)
