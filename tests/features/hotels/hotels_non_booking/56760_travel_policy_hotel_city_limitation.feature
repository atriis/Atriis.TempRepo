# Test Name: 56760 Travel Policy - Hotel - Hotel Limitations - Correct limitation of the city (not country) is triggered
# Description:
# Status: Active
# Labels: Travel policy,hotel limitations,Hotel,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-15T09:06:18Z
# Updated: 2025-04-28T06:48:20Z

@regression @travel_policy @hotel @provider:galileo @priority:high
Feature: 56760 Travel Policy - Hotel city limitation is correctly triggered

  As a corporate traveler
  I want the hotel limitation policy to trigger for the correct city (not country)
  So that OOP is only shown when the city-specific cost limit is exceeded

  Scenario: Hotel city limitation triggers OOP at hotel, room and cart level for New York
    Given I am logged in as "hotellimitation@citycountry.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "New York,NY,USA,(NYC)" for 1 night
    And I wait to see view rates text in results page
    Then only the hotels priced at or above 350 should be out of policy
    And the out of policy tooltip in results should be "Limitation  testim 2 - do not touch is violated  350 USD in New York,NY,USA,(NYC)"
    When I select the hotel priced closest below 280
    And I wait for the first add to trip button to be visible in room level results
    Then only the rooms priced at or above 350 should be out of policy
    And the out of policy tooltip in results should be "Limitation  testim 2 - do not touch is violated  350 USD in New York,NY,USA,(NYC)"
    When I add the first out of policy room to my cart
    Then the booking status should be "Pending booking"
    And the out of policy indicator should be visible in cart
    And the out of policy violations in cart should include "Limitation  testim 2 - do not touch is violated  350 USD in New York,NY,USA,(NYC)"
