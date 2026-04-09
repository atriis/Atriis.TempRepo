# Test Name: 69635 Amtrak - Travel Policy is displayed in results page
# Description:
# Status: Active
# Labels: Rail,Cart,Transportation,Amtrak Sabre,Regression,Travel policy,results,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-21T10:57:19Z
# Updated: 2026-01-20T03:34:30Z
@wip @transportation @rails @amtrak @regression @travel_policy
Feature: 69635 Amtrak - Travel policy indicator displayed in results page
  As a corporate traveler subject to travel policy
  I want to see the out-of-policy indicator in Amtrak results
  So that I can be warned when a result is outside my company travel policy

  Scenario: Out-of-policy shield icon is visible in Amtrak results and cart
    Given I am logged in as "marcoluis" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Amtrak train from "wasToBos"
    # TODO: create step "When I verify the out of policy indicator in the first Amtrak result details" in amtrak_results.steps.js
    # covers: expand first result, select first class radio button,
    # isVisible(".shield-icon") inside details panel, close overlay — OOP_is_displayed_in_results()
    When I verify the out of policy indicator in the first Amtrak result details
    Then the out of policy indicator should be visible in results
    # TODO: create step "When I add the out of policy Amtrak result to cart" in amtrak_results.steps.js
    # covers: select first result, verify ".app-out-of-policy" shows OOP badge,
    # hover info icon, verify 'Upgrade cost is greater than 5 USD' tooltip, click add to trip
    # — Add_Amtrak_one_way_from_search_results_to_cart()
    When I add the out of policy Amtrak result to cart
    Then the out of policy indicator should be visible in cart
