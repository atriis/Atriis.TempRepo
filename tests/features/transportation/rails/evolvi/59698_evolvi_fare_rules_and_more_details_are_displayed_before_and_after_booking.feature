# Test Name: 59698 Evolvi - 'Fare rules' and 'More Details' are displayed before and after booking
# Description:
# Status: Active
# Labels: Full Purchase,Regression,Pre Prod,Rail,Evolvi,Fare Rules,Terms and Conditions,more details,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-07-28T10:28:07Z
# Updated: 2025-09-11T07:15:51Z
@transportation @rails @evolvi @regression @wip
Feature: 59698 Evolvi - 'Fare rules' and 'More Details' are displayed before and after booking
  As a corporate traveler
  I want to open fare rules, more details and terms and conditions for an Evolvi rail quote
  So that the same fare information is available in results, in cart and after the booking is completed

  Scenario: Fare rules, more details and terms and conditions are available before and after booking an Evolvi rail quote
    Given I am logged in as "elisabete@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "licTo105"
    And I acknowledge the push notification
    # TODO: open the fare rules from the first Evolvi fare in results without selecting it (hover the fare amount, click "Full information"), assert the rules dialog text contains the given wording, then close the dialog
    Then the fare rules should be accessible in Evolvi results and contain "ticket"
    When I add an Evolvi one way to the trip
    Then the cart status should be Pending booking
    # TODO: open the fare rules from the Evolvi quote card in cart, assert the rules dialog text contains the given wording, then close the dialog
    And the fare rules should be accessible in the Evolvi cart and contain "ticket"
    When I click more details in cart
    Then the more details should show "Total"
    When I close more details in cart
    Then the cart terms and conditions should include "ticket"
    When I fill mandatory Evolvi fields in cart
    And I proceed to checkout
    And I complete the booking
    # TODO: open the fare rules from the Evolvi quote card in the trip overview after booking, assert the rules dialog text contains the given wording, then close the dialog
    Then the fare rules should be accessible in the Evolvi trip overview after booking and contain "ticket"
    When I click more details in cart
    Then the more details should show "Total"
    When I close more details in cart
    Then the cart terms and conditions should include "ticket"
    And I successfully cancel the trip
