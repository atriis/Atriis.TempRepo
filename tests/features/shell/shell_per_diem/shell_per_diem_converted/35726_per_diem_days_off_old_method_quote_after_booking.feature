# Test Name: 35726 Per Diem> days off old method- quote after booking
# Description:
# Status: Active
# Labels: PerDiem,PerDiem Days off,Regression,Full Purchase,Cancel by process,2026 plan 1
# Owner: pini harush
# Created: 2023-09-11T09:07:34Z
# Updated: 2026-01-19T07:40:45Z

@regression @shell @flights @per_diem
Feature: 35726 - Per-Diem days off (old method) quote after booking
  As a corporate traveler
  I want the per-diem quote to show that personal days were deducted after booking
  So that I can confirm my days off were applied to the trip

  Scenario: Selecting days off shows personal days deducted on the Per-Diem quote
    Given I am logged in as "per@hasus.off" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "lis" to "gru"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    # TODO: enable per-diem days off (create Cart.enablePerDiemDaysOff in src/dsl/Cart.js; Testim waited for ".per-diem-days-off-container .el-checkbox__label" to contain "I have days off" and clicked ".per-diem-days-off-container .el-checkbox__inner")
    And I enable per-diem days off
    # TODO: set the per-diem days off dates (create Cart.setPerDiemDaysOffDates in src/dsl/Cart.js; Testim picked a start/end date range from the days-off date-pickers)
    And I set the per-diem days off dates
    # TODO: confirm days off and proceed (create Cart.confirmPerDiemDaysOff in src/dsl/Cart.js; Testim clicked ".is-hidden-mobile")
    And I confirm the per-diem days off and proceed to the trip
    And I click go to trip button
    # TODO: verify personal days deducted (create Cart.verifyPerDiemPersonalDaysDeducted in src/dsl/Cart.js; Testim waited for ".vacation" to contain "Personal days deducted")
    Then the Per-Diem quote should show personal days deducted
