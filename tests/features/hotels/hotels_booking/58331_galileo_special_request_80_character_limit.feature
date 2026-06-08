# Test Name: 58331 Galileo - Hotel - Special request has a limit of 80 characters and booking is succeeded when special request has special characters
# Description: 
# Status: Active
# Labels: Regression,Galileo,Hotel,special request,Full Purchase,progress page,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-13T12:40:51Z
# Updated: 2025-11-27T12:00:22Z

@regression @provider:galileo
Feature:  58331 Galileo - Hotel - Special request has a limit of 80 characters and booking is succeeded when special request has special characters
  As a corporate traveler using Galileo
  I want to add a special request to my hotel booking with character limit validation
  So that my requests are submitted within the allowed character limit

  @priority:medium
  Scenario: Special request has a limit of 80 characters and booking is succeeded when special request has special characters
    Given I am logged in as "edwardcullen@galileogdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    When I add a special request text of 100 characters
    Then the special request should be truncated to 80 characters
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip

