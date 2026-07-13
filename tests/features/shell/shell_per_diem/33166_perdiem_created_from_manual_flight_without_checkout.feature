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
    When I add a flight manual quote from "lon" to "mad" round trip
    And I should see a quote with status "On hold"
    And the trip should contain a Per Diem quote
    And a Per-Diem quote should be displayed for "Madrid"
    And the Per-Diem quote status should be "Confirmed"
    Then I successfully cancel the trip
