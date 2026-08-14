# Test Name: 62825 Benerail Moove - Correct results are displayed when clicking 'Later' for the second time
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Rail,results,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-29T06:24:21Z
# Updated: 2026-01-21T09:51:49Z
@transportation @rails @benerail @regression
Feature: 62825 Benerail - Correct results displayed on second click of Later button
  As a corporate traveler
  I want to click the Later button twice and see results correctly advance each time
  So that pagination is accurate and does not show stale results

  Scenario: Benerail results are correctly advanced on the second click of the Later button
    Given I am logged in as "pmac@bene.ral" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToNlasc"
    And I wait for select text to be visible
    When I extract the first result departure time
    And I click Later and extract the first result departure time
    And I click Later and extract the subsequent first result departure time
    Then the first Later click should display results later than the initial results
    And the second Later click should display results later than the first Later click
