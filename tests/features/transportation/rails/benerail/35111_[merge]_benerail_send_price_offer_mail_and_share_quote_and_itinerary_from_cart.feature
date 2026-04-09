# Test Name: 35111 [Merge] Benerail - send price offer mail and share quote and itinerary from cart
# Description:
# Status: Active
# Labels: merge,share quote,Share Itinerary,price offer,Regression,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-01-03T04:49:41Z
# Updated: 2025-12-23T04:10:45Z
@wip @transportation @rails @benerail @regression
Feature: 35111 Benerail - Send price offer mail and share quote and itinerary from cart
  As a corporate traveler
  I want to send a price offer from results, share the quote and itinerary from cart
  So that I can distribute the Benerail booking details to stakeholders

  Scenario: Benerail price offer from results and share quote and itinerary from cart
    Given I am logged in as "shani_nl" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToNlabk"
    When I fill in NL reference fields education and courses
    # TODO: create step "Then the journey details button should be visible in Benerail results" in benerail_results.steps.js
    # covers: waitForText(".rail-list > section:nth-of-type(1) ... .btn--bold", 'Journey Details')
    Then the journey details button should be visible in Benerail results
    # TODO: create step "When I send the Benerail price offer from results" in benerail_results.steps.js
    # covers: Benerail_share_price_offer() — selects journeys and sends price offer email from results page
    When I send the Benerail price offer from results
    # TODO: create step "When I close the Benerail share bar" in benerail_results.steps.js
    # covers: page.click(".share-bar .is-clickable")
    When I close the Benerail share bar
    When I add a Benerail round trip to the trip
    When I click the share quote button
    # TODO: create step "Then the traveler name should appear in the share quote email preview" in benerail_results.steps.js
    # covers: waitForText on email body — 'Traveller(s) name: Shani Cohen'
    Then the traveler name should appear in the share quote email preview
    And I send the share
    When I click the share itinerary button
    # TODO: create step "Then the EU Rail label should appear in the share itinerary email preview" in benerail_results.steps.js
    # covers: waitForText on email body — 'EU Rail'
    Then the EU Rail label should appear in the share itinerary email preview
    And I send the share
    Then I successfully cancel the trip
