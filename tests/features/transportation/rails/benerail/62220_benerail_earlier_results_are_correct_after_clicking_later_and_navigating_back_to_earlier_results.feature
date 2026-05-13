# Test Name: 62220 Benerail - Earlier results are correct after clicking 'Later' and navigating back to 'Earlier' results
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Rail,results,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-20T07:45:15Z
# Updated: 2026-01-21T10:00:45Z
@wip @transportation @rails @benerail @regression
Feature: 62220 Benerail - Earlier results are correct after clicking Later then navigating back to Earlier
  As a corporate traveler
  I want Earlier results to correctly reset to earlier departure times after I browse Later results
  So that I can navigate backward through Benerail results without stale data

  Scenario: Benerail earlier results are correctly displayed after clicking Later then Earlier
    Given I am logged in as "justinbieber@benerail.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToSchiphol"
    And I click proceed on the reference fields popup
    # TODO: create step "Then the first Benerail result should depart from 06:00 or later" in benerail_results.steps.js
    # covers: Checking_if_the_departure_time_is_from_06_00() — validates default start time for results
    Then the first Benerail result should depart from 06:00 or later
    # TODO: create step "When I click Later and extract the first result departure time" in benerail_results.steps.js
    # covers: Click__Later__and_extracting_time() — clicks Later button and records first result dep time
    When I click Later and extract the first result departure time
    # TODO: create step "When I click Earlier and extract the first result departure time" in benerail_results.steps.js
    # covers: Click__Earlier__and_extracting_time() — clicks Earlier button and records first result dep time
    When I click Earlier and extract the first result departure time
    # TODO: create step "Then the Earlier results departure time should be before the Later results time" in benerail_results.steps.js
    # covers: tst() — asserts earlier time < later time to confirm navigation is working
    Then the Earlier results departure time should be before the Later results time
