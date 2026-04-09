# Test Name: 28870 MERGED Amtrak booking and fare rules validation, copy trip is disabled, trip cancelation
# Description:
# Status: Active
# Labels: Copy Trip,Fare Rules,Full Purchase,Pre Prod,Daily Transportation,Regression,Amtrak Sabre,Transportation,2026 plan 1
# Owner: Noam Miller
# Created: 2023-12-31T06:49:27Z
# Updated: 2026-02-11T05:31:45Z
@wip @transportation @rails @amtrak @regression @priority:critical
Feature: 28870 Amtrak - Booking with fare rules validation, copy trip disabled and trip cancellation
  As a corporate traveler
  I want to book an Amtrak round trip, verify fare rules, confirm copy trip is disabled, and cancel with refund
  So that I can validate the full Amtrak booking lifecycle

  Scenario: Amtrak round trip booking with fare rules, copy trip restriction and cancellation
    Given I am logged in as "bar" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Amtrak train from "nypToWas"
    And I click proceed on the reference fields popup
    # TODO: create step "When I check fare rules and add the Amtrak round trip to cart" in amtrak_results.steps.js
    # covers: opens fare rules for outbound (verifies Cancellations, Changes, Supplier T&C link), then for return,
    # then selects 6th result and adds to trip — Amtrak_results___Check_fare_rules_and_add_to_trip()
    When I check fare rules and add the Amtrak round trip to cart
    # TODO: create step "Then the fare rules should be accessible in cart" in amtrak.steps.js
    # covers: click both fare rules buttons in cart, verify dialog content, close — Check_Fare_rules_in_cart()
    Then the fare rules should be accessible in cart
    # TODO: create step "When I fill in Amtrak contact information and proceed to checkout" in amtrak.steps.js
    # covers: expand contact info, fill country code "1", area "310", number "3338888", save, T&C, proceed
    When I fill in Amtrak contact information and proceed to checkout
    And I complete the booking
    # TODO: create step "Then the fare rules should be accessible in the trip overview after booking" in amtrak.steps.js
    # covers: click fare rules in trip overview, verify NYP in title, Cancellations/Changes headings, close
    Then the fare rules should be accessible in the trip overview after booking
    # TODO: create step "Then the copy trip should indicate the Amtrak booking cannot be copied" in amtrak.steps.js
    # covers: hover dropdown, click Copy Trip, verify "This item can not be copied" badge, close dialog
    And the copy trip should indicate the Amtrak booking cannot be copied
    Then I successfully cancel the trip
