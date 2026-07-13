# Test Name: 35694 Per Diem> days off counter in checkout
# Description:
# Status: Active
# Labels: PerDiem,PerDiem Days off,Regression,2026 plan 1
# Owner: pini harush
# Created: 2023-09-11T09:07:34Z
# Updated: 2025-04-01T09:32:27Z

@regression @shell @flights @per_diem
Feature: 35694 - Per-Diem days off counter in checkout
  As a corporate traveler
  I want the per-diem days off counter to update as I add days off during checkout
  So that I can see how many personal days are deducted before completing the trip

  Scenario: Adding two days-off ranges updates the days off counter during checkout
    Given I am logged in as "per@limor.off" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "lis" to "gru"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I validate price change if displayed and proceed
    # TODO: enable per-diem days off (create Cart.enablePerDiemDaysOff in src/dsl/Cart.js; Testim waited for ".per-diem-days-off-container .el-checkbox__label" to contain "I have days off" and clicked ".per-diem-days-off-container .el-checkbox__inner")
    And I enable per-diem days off
    # TODO: set the per-diem days off dates (create Cart.setPerDiemDaysOffDates in src/dsl/Cart.js; Testim picked a start/end date range from the days-off date-pickers)
    And I set the per-diem days off dates
    # TODO: add a second per-diem days off range (create Cart.addPerDiemDaysOffRange in src/dsl/Cart.js; Testim clicked ".add-icon" and picked a second start/end date range)
    And I add another per-diem days off range
    # TODO: verify the days off counter (create Cart.verifyPerDiemDaysOffCounter in src/dsl/Cart.js; Testim waited for ".days-off-inputs-container > :nth-child(3) .sum-days-readonly-input" to equal "1")
    Then the per-diem days off counter should be "1"
    # TODO: confirm days off and proceed (create Cart.confirmPerDiemDaysOff in src/dsl/Cart.js; Testim clicked ".cart-btn .material-symbols-outlined")
    When I confirm the per-diem days off and proceed to the trip
    # TODO: verify the days off summary (create Cart.verifyPerDiemDaysOffSummary in src/dsl/Cart.js; Testim waited for ".has-text-weight-semibold" to contain "Flight to")
    Then the per-diem days off summary should be displayed
    Then I successfully cancel the trip
