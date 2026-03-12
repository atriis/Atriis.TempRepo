# Test Name: 22074 MERGED Hotel search - OOP shown when policy violated +travel policy determined by the primary passenger (2 users, second is the primary) + reference and dynamic on search are taken from the primary traveler (user group different from the booker)
# Description: travel policy determined by the primary passenger - 2 users, second is the primary. for NL GOV
# Status: Active
# Labels: Regression,Hotel,NL government,Travel policy,performance,No Amadeus Hotel Book,OOP,Dynamic fields,Reference Fields,Corp RF,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-12-13T05:48:23Z
# Updated: 2026-02-16T12:55:41Z

@regression @provider:general
Feature: 22074 General - OOP policy displayed in hotel and room level results for multiple travelers
  As a corporate traveler with out-of-policy hotel search
  I want to see OOP indicators in hotel and room level results
  So that I understand which hotels are outside of company policy

  @priority:high
  Scenario: OOP policy is displayed in hotel and room level for multiple travelers
    Given I am logged in as "shani_nl" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I add a second traveler as primary by name {string}" that calls DSL method addTravelerAsPrimary
    When I search for a hotel in "London" for 1 night
    Then the out of policy indicator should be visible in results
    When I select the first hotel result
    # TODO: Create step "Then the out of policy indicator should be visible in room level results" that calls DSL method verifyOOPInRoomLevel
    # TODO: Create step "When I fill in the reference fields" that calls DSL method fillReferenceFields in Checkout.js
