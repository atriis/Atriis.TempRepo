# Test Name: 33094 PerDiem created> New Method> edit line
# Description: PerDiem created right after user adding a flight and going to the checkout
# user should be able to edit table PD line
# Status: Active
# Labels: PerDiem,No Amadeus Hotel Book,Regression,progress page,Cancel by process,2026 plan 1
# Owner: pini harush
# Created: 2023-07-11T02:38:28Z
# Updated: 2026-01-19T07:34:49Z

@regression @shell @flights @per_diem
Feature: 33094 - Per-Diem quote created after issuing a flight (new method), line editable
  As a corporate traveler
  I want to edit a line in the Per-Diem quote breakdown after issuing a flight
  So that I can adjust the deductions recorded against my per-diem

  @priority:critical
  Scenario: Editing a Per-Diem breakdown line adds a deduction that is shown in the breakdown
    Given I am logged in as "new2@pidi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "lon" to "sfo"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I validate price change if displayed and proceed
    # TODO: fill the mandatory traveler questions at checkout (create Checkout.fillTravelerQuestions in src/dsl/Checkout.js; Testim typed "testim" into each ".traveler-questions [type='text']" input)
    And I fill in the mandatory traveler questions with "testim"
    And I complete the booking
    # TODO: expand the per-diem quote breakdown (create Cart.expandPerDiemQuoteBreakdown in src/dsl/Cart.js; Testim scrolled to and clicked "#el-collapse-head-9019 > i")
    When I expand the Per-Diem quote breakdown
    # TODO: verify the per-diem breakdown is shown (create Cart.verifyPerDiemQuoteBreakdownDisplayed in src/dsl/Cart.js; Testim waited for ".per-diem-quote-card .card-title" to contain "Breakdown")
    Then the Per-Diem quote breakdown should be displayed
    # TODO: edit the per-diem breakdown line to add a named deduction (create Cart.editPerDiemBreakdownLineDeduction in src/dsl/Cart.js; Testim clicked Edit "[class^='mt'] > :nth-child(1)", clicked the row icon, typed "mini bar" into "#el-id-1874-707", selected "#el-id-1874-669 > span", typed "testim" into ".is-danger [type='text']", then saved)
    When I edit the Per-Diem breakdown line adding a "mini bar" deduction
    # TODO: verify the breakdown shows the given text (create Cart.verifyPerDiemBreakdownContains in src/dsl/Cart.js; Testim waited for ".breakdown-table > :nth-child(2) .deduction p" to contain "mini bar")
    Then the Per-Diem breakdown should contain "mini bar"
