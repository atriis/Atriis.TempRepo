# Test Name: 58331 Galileo - Hotel - Special request has a limit of 80 characters and booking is succeeded when special request has special characters
# Description: 
# Status: Active
# Labels: Regression,Galileo,Hotel,special request,Full Purchase,progress page,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-13T12:40:51Z
# Updated: 2025-11-27T12:00:22Z

@regression @provider:galileo
Feature: 58331 Galileo - Special request 80 character limit validation
  As a corporate traveler using Galileo
  I want to add a special request to my hotel booking with character limit validation
  So that my requests are submitted within the allowed character limit

  @priority:medium
  Scenario: Special request field enforces 80 character limit on Galileo hotel booking
    Given I am logged in as "beatriz" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Ardoe House Hotel and Spa" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "When I add a special request text of {int} characters" that calls DSL addSpecialRequest in Cart.js
    # TODO: Create step "Then the special request should be truncated to {int} characters" that calls DSL verifySpecialRequestLimit in Cart.js
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip

