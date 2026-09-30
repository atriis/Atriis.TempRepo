# Test Name: 72013 Flights - When policy includes Is Not Contain, correctly apply in results
# Status: Design
# Labels: Flights,OOP,Travel policy,restriction
# Owner: Noam Miller
# Created: 2025-12-25T14:09:15Z
# Updated: 2026-09-29T12:18:59Z
# Parent: Bug 66650 - Flights - Travel Policy - Policy not working as intended

@regression @flights @general @oop @travel-policy
Feature: 72013 Flights - When policy includes Is Not Contain, correctly apply in results
  As a corporate traveler whose travel policy uses an "is not contains" cabin class condition
  I want only the fares outside Premium Economy that break the price limit to be out of policy and restricted
  So that Premium Economy fares stay in policy and can be selected

  Scenario: Fares outside Premium Economy above 700 USD are out of policy and restricted, Premium Economy fares are selectable
    Given I am logged in as "restrict@select.club" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip "Economy" class flight from "ATL" to "CDG"
    And flight results should be available
    # Flights are very expensive, so all results cost more than 700 USD
    Then every flight result should be out of policy and restricted
    When I click to open first pricing options
    Then every pricing option should be out of policy and restricted
    When I close pricing options modal
    And I navigate back to flight search via breadcrumb
    When I search for a round trip "Premium Economy" class flight from "ATL" to "CDG"
    And flight results should be available
    Then every flight result should be in policy and "Add to trip" button enabled
    When I click to open first pricing options
    Then every pricing option should be in policy and "Add to trip" button enabled
