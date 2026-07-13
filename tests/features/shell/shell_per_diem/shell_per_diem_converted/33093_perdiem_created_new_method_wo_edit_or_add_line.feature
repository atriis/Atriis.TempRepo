# Test Name: 33093 [Merged] PerDiem created> New Method W/O edit or add line
# Description: PerDiem created right after user adding a flight and going to the checkout
# user should not be able to add or edit PD line
# Status: Active
# Labels: PerDiem,Regression,No Amadeus Hotel Book,merge,Full Purchase,Flights,progress page,Cancel by process,2026 plan 1
# Owner: pini harush
# Created: 2023-07-11T02:38:28Z
# Updated: 2026-01-19T07:35:24Z

@regression @shell @flights @per_diem
Feature: 33093 - Per-Diem quote created after issuing a flight (new method), line not editable or addable
  As a corporate traveler
  I want the Per-Diem quote generated after I issue a flight to be read-only
  So that I cannot edit an existing line or add a new line to an automatically created Per-Diem quote

  @priority:critical
  Scenario: Per-Diem quote breakdown cannot be edited or have lines added after booking
    Given I am logged in as "new@pidi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "lon" to "mad"
    And I filter results by carrier "ib"
    And I add the first flight to cart
    When I proceed to checkout
    And I validate price change if displayed and proceed
    # TODO: fill the mandatory traveler questions at checkout (create Checkout.fillTravelerQuestions in src/dsl/Checkout.js; Testim typed "testim" into each ".traveler-questions [type='text']" input)
    And I fill in the mandatory traveler questions with "testim"
    And I complete the booking
    # TODO: expand the per-diem quote breakdown (create Cart.expandPerDiemQuoteBreakdown in src/dsl/Cart.js; Testim scrolled to and clicked "#el-collapse-head-9019 > i" then "[id='el-collapse-content-9709'] .is-clickable")
    When I expand the Per-Diem quote breakdown
    # TODO: verify the per-diem breakdown is shown (create Cart.verifyPerDiemQuoteBreakdownDisplayed in src/dsl/Cart.js; Testim waited for ".per-diem-quote-card .card-title" to contain "Breakdown")
    Then the Per-Diem quote breakdown should be displayed
    # TODO: negative validation - the per-diem line cannot be edited (create Cart.verifyPerDiemQuoteNotEditable in src/dsl/Cart.js; Testim exported this as a manual 'negative-element-validation' step)
    And the Per-Diem quote should not be editable
    # TODO: negative validation - a per-diem line cannot be added (create Cart.verifyPerDiemLineCannotBeAdded in src/dsl/Cart.js; Testim exported this as a manual 'negative-element-validation' step)
    And it should not be possible to add a Per-Diem line
