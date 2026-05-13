# Test Name: 22999 MERGED benerail booking + approval flow for benerail cost, cabin class, destination, policy and policy rule
# Description: the trip goes to the right approvers in case benerail - cost, cabin class, destination, policy, policy rule
# +validate mobile barcode in cart and itinerary mail
# Status: Active
# Labels: Approval flow,Financial Reference Code,NL government,No Amadeus Hotel Book,Full Purchase,Pre Prod,Sanity,Bene seats,Daily Transportation,Benerail Moove Regression,Transportation,2026 plan 1,02
# Owner: Shani Hadar
# Created: 2023-11-28T09:14:11Z
# Updated: 2026-02-11T04:13:48Z
@wip @transportation @rails @benerail @regression @priority:critical
Feature: 22999 Benerail - Booking and approval flow for cost, cabin class, destination and policy rules
  As a corporate traveler under NL government policy
  I want to complete a Benerail round-trip booking that triggers approval flow
  So that the trip goes to the correct approvers and mobile barcode is validated

  Scenario: Benerail full booking with approval flow and mobile barcode validation
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added traveler by name "beny cohen"
    When I search for a round trip Benerail train from "bebmiToNlasc"
    And I click proceed on the reference fields popup
    When I add a Benerail round trip to the trip
    # TODO: create step "When I checkout the Benerail booking" in benerail_results.steps.js
    # covers: checkout() — accept T&C and proceed, book and finalize
    When I proceed to checkout
    When I complete the booking
    # TODO: create step "Then the fare rules link should be visible in the Benerail trip overview" in benerail_results.steps.js
    # covers: waitForText(".ticket-details > ... .btn", 'Fare Rules')
    Then the fare rules link should be visible in the Benerail trip overview
    # TODO: create step "Then the mobile barcode should be visible in cart and itinerary mail" in benerail_results.steps.js
    # covers: Validate_mobile_barcode_in_cart_and_iti_mail() — validates barcode UI and email content
    Then the mobile barcode should be visible in cart and itinerary mail
    # TODO: create step "Then the approval flow should have the correct approvers assigned" in benerail_results.steps.js
    # covers: validate_approvers() — verifies approvers for cost, cabin class, destination, policy rules
    Then the approval flow should have the correct approvers assigned
    # TODO: create step "When I cancel the quoted Benerail booking from cart with warning" in benerail_results.steps.js
    # covers: Cancel_quote_from_cart_after_checkout_with_warning()
    When I cancel the quoted Benerail booking from cart with warning
