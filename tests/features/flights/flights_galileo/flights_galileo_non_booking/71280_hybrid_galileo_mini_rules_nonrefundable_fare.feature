# Test Name: Hybrid for 71280: Galileo - Mini Rules - Correctly parse fare rules, non-refundable fare
# Status: Active
# Labels: Gray Dawes,Galileo,mini rule,Flights,Regression,2026 plan 2,Payload
# Owner: Noam Miller
# Created: 2025-12-07T01:26:50Z
# Updated: 2026-10-08

# ADO Test Case ID: 71280
# Automates the test case's "Manual" half too: the logger check of the fare's CancelPenalty and
# ChangePenalty against the mini rules.
#
# A 1G fare added to the cart straight from the results is not re-priced: the cart mini rules are the
# penalties parsed at search time, so they are read from the search's LowFareSearchRsp. The AirPriceReq
# that add-to-cart sends is for optional services only; the backend ignores its penalties. The fare is
# found from the SelectFlight request (segments + booking classes), and the expected fees follow the
# backend parsing, in src/utils/galileoMiniRules.js:
#   - first AirPricingInfo, first ChangePenalty and first CancelPenalty only
#   - CancelPenalty Percentage 100 -> Non-refundable; ChangePenalty Amount -> that amount, not converted
#   - PenaltyApplies Anytime fills both before and after departure
# The change fee equals the ChangePenalty amount only while Gray Dawes / noamTestim Gdg have no fare
# rules markup: a markup shows up as an amount mismatch.
#
# Observed on staging, trip 3925050: AC8462 / UA8020 class G, ChangePenalty Anytime USD100.00,
# CancelPenalty Anytime 100.00%, Refundability NonRefundable. The price breakdown showed a 100.00 change
# fee and Non-refundable, before and after departure. No checkout: nothing is booked.

@ado:71280
@regression @galileo @flights @mini_rules @fare_rules @hybrid @payload
Feature: 71280 Galileo - Mini rules correctly parse non-refundable fare rules

  As a corporate traveler
  I want mini rules to correctly display non-refundable fare information
  So that I can see accurate cancellation policies in the price breakdown

  Scenario: Non-refundable fare shows correct mini rules in price breakdown
    Given I am logged in as "carCorp@gdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "YYZ" to "NYC"
    And flight results should be available
    And I filter results by carrier "AC"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I click to open price breakdown in cart
    And the price breakdown should show subtotal and non-refundable cancellation before and after departure

    # --- Manual steps: the fare's penalties in the log against the mini rules ---
    And the price breakdown change and cancellation fees should match the Galileo penalties of the fare added to the cart
    And the Galileo fare added to the cart should file a 100% cancel penalty
