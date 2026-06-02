# Test Name: 56760 Travel Policy - Hotel - Hotel Limitations - Correct limitation of the city (not country) is triggered
# Description:
# Status: Active
# Labels: Travel policy,hotel limitations,Hotel,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-15T09:06:18Z
# Updated: 2025-04-28T06:48:20Z

@regression @travel_policy @hotel @shell
Feature: 56760 Travel Policy - Hotel city limitation is correctly triggered

  As a corporate traveler
  I want the hotel limitation policy to trigger for the correct city (not country)
  So that OOP is only shown when the city-specific cost limit is exceeded

  Scenario: Hotel limitation triggers OOP at hotel and room level for New York city
    Given I am logged in as "angelinajolie@amadeusoophotel.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "New York,NY,USA,(NYC)" for 1 night(s)
    And I wait to see view rates text in results page
    # TODO: Filter by max price 375 in hotel results
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Limitation  testim 2 - do not touch is violated  350 USD in New York,NY,USA,(NYC)"
    When I select the first hotel result
    # TODO: Filter by max price 375 in room results
    Then the out of policy indicator should be visible in room results
    # TODO: Verify OOP tooltip at room level matches "Limitation  testim 2 - do not touch is violated  350 USD in New York,NY,USA,(NYC)"
