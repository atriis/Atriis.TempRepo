# Test Name: 67281 DB from overview and err msg for order not completed
# Description: 1- validate the DB in cart
# Description: 2- validate err msg
# Status: Active
# Labels: Regression,Rail,DB Rail,Cart,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-09-15T01:39:01Z
# Updated: 2025-09-15T02:01:30Z
@wip @transportation @rails @deutschebahn @regression
Feature: 67281 DB - Continue from overview and validate not completed order error
  As a corporate traveler
  I want to continue a DB order from trip overview
  So that I can see the correct error when the external order is not completed

  Scenario: DB continue flow shows not completed order error message
    Given I am logged in as "jskrl"
    # TODO: create step "When I open the first trip from the trip list" in db.steps.js or trips.steps.js
    # covers: page.click(".top-container > :nth-child(5) .icon-container > :nth-child(2)") + page.click(".trip-list > :nth-child(1) .passengers")
    When I open the first trip from the trip list
    # TODO: create step "When I open the Deutsche Bahn continue action from trip overview" in db.steps.js
    # covers: hover on DB dropdown and click Continue option
    When I open the Deutsche Bahn continue action from trip overview
    # TODO: create step "Then I should see the DB continue booking information message" in db.steps.js
    # covers: waitForText for 'Clicking Continue will open a new booking window...'
    Then I should see the DB continue booking information message
    # TODO: create step "When I continue and confirm the DB order retrieval" in db.steps.js
    # covers: click Continue button, wait, then click confirmation button in drawer
    When I continue and confirm the DB order retrieval
    # TODO: create step "Then I should see the DB order not completed error message" in db.steps.js
    # covers: waitForText for 'We're having trouble finding your Deutsche Bahn order...'
    Then I should see the DB order not completed error message
