# Test Name: 61567 FOP - When adding a new credit card and navigating back to the payment options page, existing saved cards are displayed
# Description:
# Status: Active
# Labels: FOP,Regression,credit card,general,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-02T04:36:43Z
# Updated: 2025-05-02T05:08:19Z

@regression @flights @fop @credit-card
Feature: 61567 FOP - When adding a new credit card and navigating back to the payment options page, existing saved cards are displayed
  As a corporate traveler
  I want to navigate back from the add-credit-card form to the payment options page
  So that I can still see my previously saved cards displayed

  @priority:critical
  Scenario: Existing saved cards remain visible after navigating back from add new card
    Given I am logged in as "harrypotter@ccnotdefault.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LON" to "BRU"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    Then the card "visa (not default)" should be visible
    When I click add card details button
    # TODO: new step in cart_fop.steps.js — assert 'Card details' header text is visible after navigating to add-credit-card form
    Then the card details text should be visible
    When I click the back arrow
    Then the card "visa (not default)" should be visible
