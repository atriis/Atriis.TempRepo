# Test Name: 37287 Hotel - System should not show an option to pay with other credit card in case user doesn't have privileges; if there's billback checkbox must be checked by default
# Description: 
# Status: Active
# Labels: CR7,No Amadeus Hotel Book,Hotel,Billback,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-06T04:53:30Z
# Updated: 2024-10-01T01:50:32Z

@regression @provider:general
Feature: 37287 Hotel - System should not show an option to pay with other credit card in case user doesn't have privileges; if there's billback checkbox must be checked by default
  As a corporate traveler with restricted payment privileges
  I want to see only the allowed payment methods in cart
  So that I don't accidentally use unauthorized payment methods

  @priority:high
  Scenario: System should not show an option to pay with other credit card in case user doesn't have privileges; if there's billback checkbox must be checked by default
    Given I am logged in as "lilyaldrin@billback.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "AMS" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I click the set billback button in cart
    Then the card "billback" should be visible
    Then payment restriction text should be visible
    Then the card "billback" checkbox should be checked
    Then the request billback text should be displayed with checkbox checked by default
    Then add credit card details option should not be visible