# Test Name: 60661 Hotels - Credit card from user profile is displayed
# Description: 
# Status: Active
# Labels: Hotel,general,Regression,FOP,credit card,Administration,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-09T10:48:54Z
# Updated: 2025-04-09T11:19:41Z

@regression @provider:general
Feature: 60661 General - Credit cards from user profile are available in cart FOP
  As a corporate traveler
  I want to see my profile credit cards available in the cart payment panel
  So that I can use my pre-saved payment methods without re-entering card details

  @priority:high
  Scenario: Two user profile credit cards are visible in cart FOP panel
    Given I am logged in as "general" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    # TODO: Create step "Then {int} profile credit cards should be visible in the FOP panel" that calls DSL verifyProfileCardCount with 2 in CartFop.js

