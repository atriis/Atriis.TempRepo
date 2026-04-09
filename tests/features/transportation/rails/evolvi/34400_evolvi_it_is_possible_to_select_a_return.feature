# Test Name: 34400 Evolvi - It is possible to select a return
# Description:
# Status: Active
# Labels: Regression,results,Rail,Evolvi,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-06-05T11:48:31Z
# Updated: 2025-06-08T12:33:34Z
@wip @transportation @rails @evolvi @regression
Feature: 34400 Evolvi - It is possible to select a return
  As a corporate traveler
  I want to select outbound and inbound Evolvi fares
  So that the inbound selection reflects the expected return leg information

  Scenario: Select outbound fare and validate inbound selection information
    Given I am logged in as "eve" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Evolvi train from "oxfToWin"
    # TODO: create step "When I close mandatory notifications if displayed" in evolvi_results.steps.js
    # covers: Mandatory_notifications()
    When I close mandatory notifications if displayed
    # TODO: create step "Then the Select outbound prompt should be displayed" in evolvi_results.steps.js
    # covers: waitForText(..., 'Select outbound')
    Then the Select outbound prompt should be displayed
    # TODO: create step "When I select an outbound Evolvi fare" in evolvi_results.steps.js
    # covers: page.click("[aria-describedby='el-tooltip-1035'] .amount")
    When I select an outbound Evolvi fare
    # TODO: create step "When I select the highlighted inbound Evolvi fare" in evolvi_results.steps.js
    # covers: scrollToElement('.focusing') + page.click('.focusing')
    When I select the highlighted inbound Evolvi fare
    # TODO: create step "Then the inbound selection should display the selected return time" in evolvi_results.steps.js
    # covers: getText(hour) + waitForText(..., new RegExp("Inbound: "+hour))
    Then the inbound selection should display the selected return time
