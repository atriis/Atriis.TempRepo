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
    Given I am logged in as "beny@moove.com" booking a new trip
    When I navigate to the Benerail rail search tab
    And I select the one way trip type for the Benerail search
    And I set the Benerail departure time to "04:00"
    Then the Benerail departure time should display "04:00"
    When I set the Benerail departure time to "04:45"
    Then the Benerail departure time should display "04:45"
    When I enable the via station option on the Benerail search form
    Then the Benerail departure time should display "04:45"
