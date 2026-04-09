# Test Name: 46290 [Merge] Evolvi - "Please select gender" text in gender field (guest user) is displayed and error message is displayed instead of infinity spinner
# Description:
# Status: Active
# Labels: Regression,merge,guest,Rail,Evolvi,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-22T09:33:42Z
# Updated: 2025-09-14T09:14:20Z
@wip @transportation @rails @evolvi @regression
Feature: 46290 Evolvi - Guest gender prompt and no results error display
  As a corporate traveler
  I want to add a guest in Evolvi search
  So that gender prompt appears and the flow returns a user-friendly no-results message

  Scenario: Guest traveler shows gender prompt and no-results messaging
    Given I am logged in as "corp_evolvi" booking a new trip
    # TODO: create step "When I select UK Rail in the search form" in evolvi_search.steps.js
    When I select UK Rail in the search form
    # TODO: create step "When I open the traveler drawer" in search.steps.js
    # covers: page.click('.has-text-weight-semibold')
    When I open the traveler drawer
    # TODO: create step "When I click add guest traveler" in search.steps.js
    # covers: page.click('.add-guest-btn')
    When I click add guest traveler
    # TODO: create step "Then the gender field should display Please select gender" in search.steps.js
    # covers: waitForText(..., 'Please select gender')
    Then the gender field should display Please select gender
    # TODO: create step "When I close the guest traveler dialog" in search.steps.js
    # covers: page.click('.el-dialog__header ...')
    When I close the guest traveler dialog
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "licToLic"
    # TODO: create step "When I close mandatory notifications if displayed" in evolvi_results.steps.js
    When I close mandatory notifications if displayed
    # TODO: create step "Then the Evolvi no-results helper message should be displayed" in evolvi_results.steps.js
    # covers: waitForText('.uk-rail-results p', 'Please modify filter criteria or edit your search')
    Then the Evolvi no-results helper message should be displayed
    # TODO: create step "Then the Evolvi no results title should be displayed" in evolvi_results.steps.js
    # covers: waitForText('h3', 'No results found')
    Then the Evolvi no results title should be displayed
