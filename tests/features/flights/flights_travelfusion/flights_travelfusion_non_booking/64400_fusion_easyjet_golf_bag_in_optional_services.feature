# Test Name: 64400 Fusion - EasyJet - 'Golf Bag' is displayed as an option in 'Optional Services' in a specific flight route
# Status: Active
# Labels: Regression,Fusion,Flights,Optional Services,specific,EasyJet,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-07-14T09:12:51Z
# Updated: 2025-07-14T09:50:51Z

@regression @flights @fusion @optional-services @easyjet @priority:medium
Feature: 64400 Fusion EasyJet - Golf Bag option displayed in Optional Services for specific route
  As a corporate traveler booking an EasyJet flight on a specific route via Fusion
  I want to see the Golf Bag option in Optional Services
  So that I can add a golf bag to my booking

  Scenario: Golf Bag option is displayed in Optional Services for LGW-IOM EasyJet route
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LGW" to "IOM"
    Then flight results should be available
    When I filter results by carrier "U2"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click optional services in extras
    Then the "Golf Bag" option should be displayed in optional services
