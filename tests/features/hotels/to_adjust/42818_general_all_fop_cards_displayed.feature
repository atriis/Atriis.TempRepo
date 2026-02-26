# Test Name: 42818 Hotels - All cards that were configured are displayed in payment section on cart page
# Description: 
# Status: Active
# Labels: Regression,Hotel,FOP,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-02-26T08:47:36Z
# Updated: 2024-03-19T10:32:27Z

@regression @provider:general
Feature: 42818 General - All FOP cards displayed in cart payment panel
  As a corporate traveler
  I want to see all available payment cards in the cart FOP panel
  So that I can choose the correct payment method for my booking

  @priority:high
  Scenario: Three payment cards are visible in the FOP panel
    Given I am logged in as "general" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "The Mandrake" for 1 night
    And I select the first hotel result
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    # TODO: Create step "Then {int} payment cards should be visible in the FOP panel" that calls DSL verifyCardCount in CartFop.js
