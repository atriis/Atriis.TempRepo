# Test Name: 33007 Manual quotes - PerDiem with upload file to quote
# Status: Active
# Labels: Regression,Manual Quote,No Amadeus Hotel Book,Pre Prod,2026 plan 1
# Owner: Noam Miller
# Created: 2023-07-06T12:58:05Z
# Updated: 2025-08-19T01:32:16Z
@regression @manual_quote
Feature: 33007 Manual Quote - Per Diem quote with file upload
  As a corporate traveler
  I want to add a Per Diem manual quote and attach a supporting document
  So that the file is stored against the quote in the trip

  @priority:critical
  Scenario: Add Per Diem manual quote with file upload to a new trip
    Given I am logged in as "manualQuote@testim.com" booking a new trip
    And I have added myself as the traveler
    When I add a "Per Diem" other manual quote with comment "3 full days" and base fare 350
    Then the booking status should be "Confirmed"
    And I upload the file "sample-document.pdf" to the quote extras
    Then the file "sample-document.pdf" should be visible in the quote extras
