# Test Name: 29414 BeneRail> Verify that the terms/fare roles are loading in results, cart and checkout
# Description:
# Status: Active
# Labels: Fare Rules,No Amadeus Hotel Book,Regression,Bene seats,Benerail Moove Regression,progress page,Transportation,2026 plan 1,02
# Owner: Bruna Santos
# Created: 2023-05-31T03:29:27Z
# Updated: 2026-02-17T07:46:17Z
@wip @transportation @rails @benerail @regression @priority:critical
Feature: 29414 Benerail - Fare rules loading in results, cart and checkout
  As a corporate traveler
  I want to see Benerail fare rules in results, cart and checkout/trip overview
  So that I can verify terms are accessible at every stage of the booking

  Scenario: Benerail fare rules are accessible in results, cart and after booking
    Given I am logged in as "beny" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToNlasc"
    And I click proceed on the reference fields popup
    When I select the first Benerail option
    # TODO: create step "Then the fare rules should be accessible in Benerail results" in benerail_results.steps.js
    # covers: Benerail___Results___Check__Fare_Rules_() — opens fare rules in results page and validates content
    Then the fare rules should be accessible in Benerail results
    When I add a Benerail round trip to the trip
    # TODO: create step "Then the Benerail expiry tooltip should show at least {int} minutes" in benerail_results.steps.js
    # covers: Expiry_tool_tip__validate_number_of_minutes(20)
    Then the Benerail expiry tooltip should show at least 20 minutes
    # TODO: create step "Then the fare rules should be accessible in the Benerail cart" in benerail_results.steps.js
    # covers: Benerail___Cart___Check__Fare_Rules_() — validates fare rules in cart
    Then the fare rules should be accessible in the Benerail cart
    When I proceed to checkout
    When I complete the booking
    # TODO: create step "Then the fare rules should be accessible in the Benerail trip overview after booking" in benerail_results.steps.js
    # covers: Benerail___Cart___Check__Fare_Rules__1() — validates fare rules in trip overview after booking
    Then the fare rules should be accessible in the Benerail trip overview after booking
    When I cancel the Benerail trip with warning and continue
