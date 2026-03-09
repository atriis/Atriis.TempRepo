# Test Name: 37287 Hotel - System should not show an option to pay with other credit card in case user doesn't have privileges; if there's billback checkbox must be checked by default
# Description: 
# Status: Active
# Labels: CR7,No Amadeus Hotel Book,Hotel,Billback,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-06T04:53:30Z
# Updated: 2024-10-01T01:50:32Z

@regression @provider:general
Feature: 37287 General - No other CC privilege and billback checkbox
  As a corporate traveler with restricted payment privileges
  I want to see only the allowed payment methods in cart
  So that I don't accidentally use unauthorized payment methods

  @priority:high
  Scenario: Billback checkbox is available and only allowed payment methods are shown
    Given I am logged in as "general" "user_lilyaldrin" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I click the set billback button in cart
    Then the card "billback" should be visible
    Then payment restriction text should be visible
    Then the card "billback" checkbox should be checked
    Then add credit card details option should not be visible
