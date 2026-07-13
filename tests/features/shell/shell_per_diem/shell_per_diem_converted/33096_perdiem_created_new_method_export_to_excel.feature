# Test Name: 33096 PerDiem created> New Method> export to excel
# Description: User can download excel file of PD
# Status: Active
# Labels: PerDiem,Regression,No Amadeus Hotel Book,progress page,Cancel by process,2026 plan 1
# Owner: pini harush
# Created: 2023-07-11T02:38:28Z
# Updated: 2026-01-19T07:39:15Z

@regression @shell @flights @per_diem
Feature: 33096 - Per-Diem quote created after issuing a flight (new method), export to Excel
  As a corporate traveler
  I want to export the Per-Diem quote to an Excel file
  So that I can download and keep a copy of my per-diem details

  @priority:critical
  Scenario: The Per-Diem quote can be exported and downloaded as an Excel file
    Given I am logged in as "new@pidi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "lon" to "sfo"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I validate price change if displayed and proceed
    # TODO: fill the mandatory traveler questions at checkout (create Checkout.fillTravelerQuestions in src/dsl/Checkout.js; Testim typed "testim" into each ".traveler-questions [type='text']" input)
    And I fill in the mandatory traveler questions with "testim"
    And I complete the booking
    # TODO: verify the per-diem quote is displayed (create Cart.verifyPerDiemQuoteDisplayed in src/dsl/Cart.js; Testim waited for ".center-title" to contain "for Eran Pidi")
    Then a Per-Diem quote should be displayed in the trip overview
    # TODO: expand the per-diem quote breakdown (create Cart.expandPerDiemQuoteBreakdown in src/dsl/Cart.js; Testim clicked "#el-collapse-head-9709 > i")
    When I expand the Per-Diem quote breakdown
    # TODO: verify the per-diem breakdown is shown (create Cart.verifyPerDiemQuoteBreakdownDisplayed in src/dsl/Cart.js; Testim waited for ".per-diem-quote-card .card-title" to contain "Breakdown")
    Then the Per-Diem quote breakdown should be displayed
    # TODO: export the per-diem quote to Excel (create Cart.exportPerDiemQuoteToExcel in src/dsl/Cart.js; Testim clicked "Export to excel" "[class^='mt'] > :nth-child(1)", waited for the "Additional currency" dialog, then clicked ".btn--primary")
    When I export the Per-Diem quote to Excel
    # TODO: verify the Excel file downloaded (create Cart.verifyPerDiemExcelDownloaded in src/dsl/Cart.js; Testim exported this as a manual 'cli-validation-download-file' step - assert the downloaded .xlsx file)
    Then the Per-Diem quote Excel file should be downloaded
