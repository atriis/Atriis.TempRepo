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
    When I search for a round trip flight from "lis" to "auh"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I enable per-diem days off
    And I set the per-diem days off dates
    And I add another per-diem days off range
    And I complete the booking
    And the Per-Diem quote status should be "Confirmed"
    Then the Per-Diem quote should show personal days deducted
