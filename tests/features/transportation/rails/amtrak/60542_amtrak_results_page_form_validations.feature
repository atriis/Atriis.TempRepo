# Test Name: 60542 Amtrak results page form validations
# Description: Amtrak results validations
# Status: Active
# Labels: search,Regression,Amtrak Sabre,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-04-03T11:58:22Z
# Updated: 2025-12-22T10:16:49Z
@wip @transportation @rails @amtrak @regression
Feature: 60542 Amtrak - Results page form validations
  As a corporate traveler
  I want to validate the Amtrak results page interactions
  So that I can confirm fare rules, share, result details and add-to-trip flows work correctly

  Scenario: Amtrak results page - fare rules, share, details and add to trip
    Given I am logged in as "bar@benerail.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Amtrak train from "nypToWas"
    And I click proceed on the reference fields popup
    # TODO: create step "When I share the price offer from the Amtrak results page" in amtrak_results.steps.js
    # covers: click share icon at top of results, select trains for both city pairs, open share email panel,
    # verify "Train Offer" in email preview, send — Share_q_from_results()
    When I share the price offer from the Amtrak results page
    # TODO: create step "And I close the Amtrak results share panel" in amtrak_results.steps.js
    # covers: page.click(".share-bar .is-clickable")
    And I close the Amtrak results share panel
    # TODO: create step "When I view fare rules for the first Amtrak result" in amtrak_results.steps.js
    # covers: page.click(".amtrak-list > :nth-child(1) .no-padding") to open fare rules on first result
    When I view fare rules for the first Amtrak result
    # TODO: create step "Then the fare rules modal should show the supplier terms and conditions link" in amtrak_results.steps.js
    # covers: waitForText '...target=_blank', 'Supplier Terms & Conditions'
    Then the fare rules modal should show the supplier terms and conditions link
    # TODO: create step "When I close the Amtrak fare rules modal" in amtrak_results.steps.js
    # covers: page.click on SVG close button in the fare rules modal
    When I close the Amtrak fare rules modal
    # TODO: create step "And I expand the first Amtrak result details" in amtrak_results.steps.js
    # covers: page.click(".amtrak-list > :nth-child(1) [hassabreresults='true']")
    And I expand the first Amtrak result details
    # TODO: create step "Then the available classes and fares should be displayed" in amtrak_results.steps.js
    # covers: waitForText(".classes-card .mb-4", 'Available Classes And Fares')
    Then the available classes and fares should be displayed
    When I click more details for the first Amtrak result
    When I add the first result to trip
