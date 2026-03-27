# Test Name: 68133 Price Offer - Flight - 'Safety information and travel restriction' text is not displayed in price offer from results
# Status: Active
# Labels: Regression,Flights,share quote,price offer,results,general,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-26T03:47:56Z
# Updated: 2025-09-26T04:06:42Z

@regression @flights @general @price-offer
Feature: 68133 Flights - Safety info text not displayed in price offer from results
  As a corporate traveler
  I want the safety information text to not appear in the price offer from results
  So that the price offer is clean and professional

  Scenario: Safety information text is not displayed in price offer from results
    Given I am logged in as "bruna_galileo" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "MME" to "AMS"
    And flight results should be available
    # TODO: Step needed for "Click to share two quotes from results page and verify safety text is NOT displayed"
