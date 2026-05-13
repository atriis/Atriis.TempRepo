# Test Name: 69249 Sabre - Flights - Fare rules displayed in Multi City search
# Status: Active
# Labels: Fare Rules,Regression,Flights,Pricing Options,multi city,Sabre,results,Cart,Flight Details,additional pricing options,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-24T03:39:34Z
# Updated: 2025-10-24T05:06:00Z

@regression @flights @sabre @fare-rules @multi-city @pricing-options
Feature: 69249 Sabre - Fare rules displayed in multi-city search
  As a corporate traveler
  I want to view fare rules in a multi-city flight search
  So that I can review terms before booking

  Scenario: Fare rules are accessible in results, pricing options, flight details, and cart for multi-city
    Given I am logged in as "robsoncruz@sabrecargdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "IAH-DFW" and "MIA-IAH" and "ORD-IAH"
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
