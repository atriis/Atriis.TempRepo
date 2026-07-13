# Test Name: 33095 PerDiem created> New Method> add line
# Description: PerDiem created right after user adding a flight and going to the checkout
# user should be able to add line to the table PD
# Status: Active
# Labels: PerDiem,Regression,No Amadeus Hotel Book,progress page,Cancel by process,2026 plan 1
# Owner: pini harush
# Created: 2023-07-11T02:38:28Z
# Updated: 2026-01-19T07:35:20Z

@regression @shell @flights @per_diem
Feature: 33095 - Per-Diem quote created after issuing a flight (new method), line addable
  As a corporate traveler
  I want to add a line to the Per-Diem quote breakdown after issuing a flight
  So that I can record an additional per-diem item against my trip

  @priority:critical
  Scenario: Adding a line to the Per-Diem breakdown shows the new line in the breakdown
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
    # TODO: add a new line to the per-diem breakdown (create Cart.addPerDiemBreakdownLine in src/dsl/Cart.js; Testim clicked Add line "[class^='mt'] > :nth-child(2)", typed "bkk" into "[valuekey='value']" destination, selected a service category via ".app-select" ("#el-id-495-697 > span"), typed "testim" into "[placeholder='Comment']", then saved ".per-diem-quote-card [class^='mr']")
    When I add a line to the Per-Diem breakdown for destination "bkk" with comment "testim"
    # TODO: verify the breakdown shows the given text (create Cart.verifyPerDiemBreakdownContains in src/dsl/Cart.js; Testim waited for ".breakdown-table > :nth-child(6) .deduction p" to contain "limo")
    Then the Per-Diem breakdown should contain "limo"
