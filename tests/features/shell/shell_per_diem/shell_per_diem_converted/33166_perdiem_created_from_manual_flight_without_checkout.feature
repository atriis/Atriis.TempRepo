# Test Name: 33166 PerDiem created from manual flight without checkout
# Description: per diem should be created for flight round trip even without checkout
# Status: Active
# Labels: Regression,Manual Quote,PerDiem,Keeps failing,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-10-09T06:12:14Z
# Updated: 2025-10-19T08:14:32Z

@regression @shell @manual_quote @per_diem
Feature: 33166 - Per-Diem quote created from a manual round-trip flight without checkout
  As a corporate traveler
  I want a Per-Diem quote to be created for a manual round-trip flight even without checking out
  So that my per-diem is recorded as soon as the flight is added to the trip

  Scenario: A manual round-trip flight creates an On-hold Per-Diem quote that can then be cancelled
    Given I am logged in as "uri@pidi.com" booking a new trip
    And I have added myself as the traveler
    # NOTE: the existing manual flight quote step takes only from/to; the Testim source builds a full round trip (LON->MAD outbound + MAD->LON inbound) with specific carriers/times/flight numbers ("el al", "british", 123/456). Verify ManualQuoteSearch DSL creates a round trip; extend it if it only produces a one-way quote.
    When I add a flight manual quote from "lon" to "mad"
    Then the last quote status should be "On hold"
    # TODO: verify the trip has a Per Diem quote (create Cart.verifyTripContainsPerDiemQuote in src/dsl/Cart.js; Testim waited for ".quote-info > :nth-child(1) .muliSemiBold" to contain "Per diem")
    And the trip should contain a Per Diem quote
    # TODO: verify the per-diem quote is for the destination (create Cart.verifyPerDiemQuoteDisplayedFor in src/dsl/Cart.js; Testim waited for ".center-title" and ".per-diem-quote-card .has-text-weight-semibold" to contain "Per-Diem for Madrid")
    And a Per-Diem quote should be displayed for "Madrid"
    # TODO: verify the per-diem quote status (create Cart.verifyPerDiemQuoteStatus in src/dsl/Cart.js; Testim waited for ".per-diem-quote-card [class^='ml']" to contain "Confirmed")
    And the Per-Diem quote status should be "Confirmed"
    Then I successfully cancel the trip
