# Test Name: 59794 Checkout - "Yay! No additional details are required..." is not displayed when user has additional details
# Description:
# Status: Active
# Labels: Regression,Checkout,general,additional details,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-25T10:44:23Z
# Updated: 2025-03-25T11:19:13Z

@regression @shell @hotels @checkout
Feature: 59794 - Checkout "Yay! No additional details are required..." is not displayed when user has additional details
  As a corporate traveler who has additional details configured on their account
  I want to proceed to the checkout page after booking a hotel
  So that the "Yay! No additional details are required..." message is correctly suppressed when additional details are present

  Scenario: "Yay! No additional details are required..." is not displayed on checkout when user has additional details
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    And I add a refundable room to my cart
    And I handle conflicting quotes if visible
    When I proceed to checkout
    # TODO: negative-element-validation — verify the "Yay! No additional details are required..." message is NOT displayed on the checkout page
    #       Proposed step: Then "Yay! No additional details are required..." should not be displayed on the checkout page
    #       DSL method: Checkout.verifyYayMessageNotVisible(page)
    # TODO: negative-element-validation — verify the "Yay! No additional details are required..." message is NOT displayed (second check)
    #       Proposed step: Then "Yay! No additional details are required..." should not be displayed on the checkout page
    #       DSL method: Checkout.verifyYayMessageNotVisible(page)
    # TODO: negative-element-validation — verify the "Yay! No additional details are required..." message is NOT displayed (third check)
    #       Proposed step: Then "Yay! No additional details are required..." should not be displayed on the checkout page
    #       DSL method: Checkout.verifyYayMessageNotVisible(page)
