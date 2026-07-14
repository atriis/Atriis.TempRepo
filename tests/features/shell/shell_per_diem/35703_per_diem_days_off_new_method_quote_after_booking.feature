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
    And I enable per-diem days off
    And I set the per-diem days off dates spanning 2 days
    Then the first per-diem days off counter should be "2"
    And I complete the booking
    And the Per-Diem quote status should be "Confirmed"
    Then the Per-Diem quote amount should be "3000.00"
