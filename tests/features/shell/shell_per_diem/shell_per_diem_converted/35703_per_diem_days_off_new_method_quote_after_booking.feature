# Test Name: 35703 Per Diem> days off new method- quote after booking
# Description:
# Status: Active
# Labels: PerDiem,PerDiem Days off,Regression,Full Purchase,Cancel by process,2026 plan 1
# Owner: pini harush
# Created: 2023-09-11T09:07:34Z
# Updated: 2026-01-19T07:40:24Z

@regression @shell @flights @per_diem
Feature: 35703 - Per-Diem days off (new method) quote after booking
  As a corporate traveler
  I want the per-diem quote amount to reflect the days off I selected after booking
  So that my per-diem allowance is reduced correctly for personal days

  Scenario: Selecting days off updates the Per-Diem quote amount shown on the trip
    Given I am logged in as "per@limor.off" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "lon" to "mad"
    And I filter results by carrier "BA"
    And I add the first flight to cart
    When I proceed to checkout
    # TODO: enable per-diem days off (create Cart.enablePerDiemDaysOff in src/dsl/Cart.js; Testim waited for ".per-diem-days-off-container .el-checkbox__label" to contain "I have days off" and clicked ".per-diem-days-off-container .el-checkbox__inner")
    And I enable per-diem days off
    # TODO: set the per-diem days off dates (create Cart.setPerDiemDaysOffDates in src/dsl/Cart.js; Testim picked a start/end date range from the days-off date-pickers)
    And I set the per-diem days off dates
    # TODO: confirm days off and proceed (create Cart.confirmPerDiemDaysOff in src/dsl/Cart.js; Testim clicked ".is-hidden-mobile")
    And I confirm the per-diem days off and proceed to the trip
    And I click go to trip button
    # TODO: verify the per-diem quote amount (create Cart.verifyPerDiemQuoteAmount in src/dsl/Cart.js; Testim waited for ".per-diem-quote-card .amount" to contain "3000.00")
    Then the Per-Diem quote amount should be "3000.00"
