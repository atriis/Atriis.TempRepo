# Test Name: HYBRID for 67014 Expiry - "Search again" on expired quote
# Description: Validate "Search Again" on expired quote
# Status: Active
# Labels: Regression,Rail,Evolvi,Expiry,hybrid,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-09-12T10:21:52Z
# Updated: 2026-01-06T12:25:48Z
@transportation @rails @evolvi @regression @hybrid
Feature: 67014 HYBRID Evolvi - Search again on an expired quote
  As a corporate traveler
  I want an expired Evolvi quote to offer a Search again action
  So that I can re-run the original journey search instead of booking an expired fare

  Scenario: Search again on an expired Evolvi quote re-runs the original journey search
    Given I am logged in as "corp@Evolvi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "182To115"
    And I acknowledge the push notification
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
