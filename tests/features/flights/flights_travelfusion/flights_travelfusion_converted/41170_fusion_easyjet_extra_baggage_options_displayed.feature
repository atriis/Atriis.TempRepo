# Test Name: 41170 Fusion - EasyJet - Extra baggage options are displayed
# Status: Active
# Labels: Regression,Fusion,baggage,FailedFusion,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-01-15T04:48:32Z
# Updated: 2025-07-14T09:12:31Z

@regression @flights @fusion @baggage @easyjet @priority:medium
Feature: 41170 Fusion EasyJet - Extra baggage options are displayed
  As a corporate traveler booking an EasyJet flight via Fusion
  I want to see extra baggage options in the cart
  So that I can choose appropriate baggage for my flight

  Scenario: Extra baggage options are displayed for EasyJet Fusion flight
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "GLA" to "BRS"
    And I add the first flight to cart
    # TODO: implement 'the extra baggage options should be displayed in cart' — see Extra_baggage_options_are_displayed() in Testim source (test 41170)
    Then I successfully cancel the trip
