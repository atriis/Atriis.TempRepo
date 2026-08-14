# Test Name: 29414 BeneRail> Verify that the terms/fare roles are loading in results, cart and checkout
# Description:
# Status: Active
# Labels: Fare Rules,No Amadeus Hotel Book,Regression,Bene seats,Benerail Moove Regression,progress page,Transportation,2026 plan 1,02
# Owner: Bruna Santos
# Created: 2023-05-31T03:29:27Z
# Updated: 2026-02-17T07:46:17Z
@transportation @rails @benerail @regression @priority:critical
Feature: 29414 Benerail - Fare rules loading in results, cart and checkout
  As a corporate traveler
  I want to see Benerail fare rules in results, cart and checkout/trip overview
  So that I can verify terms are accessible at every stage of the booking

  Scenario: Benerail fare rules are accessible in results, cart and after booking
    Given I am logged in as "pmac@bene.ral" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToNlasc"
    And the fare rules should be accessible in Benerail results and contain "ticket information"
    When I add a Benerail one way to the trip
    And the booking status should be "Pending booking"
    And the fare rules should be accessible in the Benerail cart and contain "ticket information"
    And I proceed to checkout
    And I complete the booking
    Then the trip overview should show the journey details button
    And the fare rules should be accessible in the Benerail trip overview after booking and contain "ticket information"
