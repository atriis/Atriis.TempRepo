# Test Name: 68008 Transportation - Redesign of the time-picker component
# Description:
# Status: Active
# Labels: Rail,Benerail Moove Regression,Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-09-26T04:29:26Z
# Updated: 2025-09-26T05:09:27Z
@wip @transportation @rails @benerail @regression
Feature: 68008 Transportation - Redesigned time-picker component validation
  As a corporate traveler
  I want to use the redesigned time-picker component for Benerail search
  So that selecting departure and return times is intuitive and functions correctly

  Scenario: Redesigned time-picker component works correctly in the Benerail search form
    Given I am logged in as "beny" booking a new trip
    # NOTE: This test does NOT add a traveler — it goes directly to validate the time-picker UI
    # TODO: create step "Then the Benerail time-picker component should function correctly" in benerail_search.steps.js
    # covers: Validate_Time_picker() — tests all time-picker interactions (hours, minutes, AM/PM or 24h format)
    Then the Benerail time-picker component should function correctly
