# Test Name: 62469 Bene> Rail Check-In Information and Requirement
# Description: existing trip 3492126 (as new trips with check in info are not common)
# to check the msg, button and time info
# Status: Active
# Labels: Cart,Benerail Moove Regression,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-05-22T06:34:25Z
# Updated: 2025-06-24T10:33:07Z
@wip @transportation @rails @benerail @regression
Feature: 62469 Benerail - Rail check-in information and requirement message in cart
  As a corporate traveler with a Benerail booking that requires check-in
  I want to see the check-in notice, button, and time information in the cart
  So that I know I need to check in before travel

  Scenario: Check-in required message and button appear for a Benerail trip with check-in segments
    # NOTE: This test navigates directly to a specific existing trip (3492126) after login.
    # The trip was pre-booked as new trips with check-in info are uncommon in test environments.
    Given I am logged in as "bene@sncb.com"
    # TODO: create step "When I navigate to the cart of trip {int}" in trips.steps.js or app.steps.js
    # covers: page.goto('https://ui.gtp-staging.com/trips/3492126/cart') — direct navigation to known trip
    When I navigate to the cart of trip 3492126
    # TODO: create step "Then the check-in required notice should be visible in cart" in benerail_results.steps.js
    # covers: waitForText(".app-msg-text", 'Important: Some train segments require check-in.')
    Then the check-in required notice should be visible in cart
    # TODO: create step "Then the Check-in button should be visible in cart" in benerail_results.steps.js
    # covers: waitForText(".el-tabs .btn--primary", 'Check-in')
    Then the Check-in button should be visible in cart
    # TODO: create step "When I click the Check-in button in cart" in benerail_results.steps.js
    # covers: page.click(".el-tabs .btn--primary")
    When I click the Check-in button in cart
    # TODO: create step "Then the check-in panel should show the Outbound leg" in benerail_results.steps.js
    # covers: waitForText(".leg-title", 'Outbound')
    Then the check-in panel should show the Outbound leg
    # TODO: create step "Then the check-in panel should show the Available from time" in benerail_results.steps.js
    # covers: waitForText on availability time text containing /Available from/
    Then the check-in panel should show the Available from time
