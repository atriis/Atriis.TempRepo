# Test Name: 62825 Benerail Moove - Correct results are displayed when clicking 'Later' for the second time
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Rail,results,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-29T06:24:21Z
# Updated: 2026-01-21T09:51:49Z
@wip @transportation @rails @benerail @regression
Feature: 62825 Benerail - Correct results displayed on second click of Later button
  As a corporate traveler
  I want to click the Later button twice and see results correctly advance each time
  So that pagination is accurate and does not show stale results

  Scenario: Benerail results are correctly advanced on the second click of the Later button
    Given I am logged in as "shani_nl" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToGbspx"
    # TODO: create step "And I fill in the reference field if required" in benerail_search.steps.js
    # covers: Ref_field_if_needed() — fills a reference field only if the popup is visible
    And I fill in the reference field if required
    And I click proceed on the reference fields popup
    # TODO: create step "When I close the mandatory notification banner if visible" in benerail_results.steps.js
    # covers: Close_mandatory_notification() — dismisses a mandatory info banner if shown
    When I close the mandatory notification banner if visible
    # TODO: create step "When I click Later and extract the first result departure time" (reuse from 62220)
    When I click Later and extract the first result departure time
    # TODO: create step "When I click Later and extract the subsequent first result departure time" in benerail_results.steps.js
    # covers: Click__Later__and_extracting_time_1() — second click on Later, extracts the new first departure time
    When I click Later again and extract the subsequent departure time
    # TODO: create step "Then the second Later click should display results later than the first Later click" in benerail_results.steps.js
    # covers: Verifying_Earlier_results_are_correct_after_clicking__Later__and_navigating_back_to__Earlier__results()
    Then the second Later click should display results later than the first Later click
