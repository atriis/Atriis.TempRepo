# Test Name: 35694 Per Diem> days off counter in checkout
# Description:
# Status: Active
# Labels: PerDiem,PerDiem Days off,Regression,2026 plan 1
# Owner: pini harush
# Created: 2023-09-11T09:07:34Z
# Updated: 2025-04-01T09:32:27Z

@regression @shell @flights @per_diem
Feature: 35694 - Per-Diem days off counter in checkout
  As a corporate traveler
  I want the per-diem days off counter to update as I add days off during checkout
  So that I can see how many personal days are deducted before completing the trip

  Scenario: Adding two days-off ranges updates the days off counter during checkout
    Given I am logged in as "per@limor.off" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "lis" to "doh"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I enable per-diem days off
    And I set the per-diem days off dates
    And I add another per-diem days off range
    Then the first per-diem days off counter should be "1"
    And the second per-diem days off counter should be "2"
    And I navigate to cart from checkout
    And the booking status should be "On hold"
    Then the per-diem days off summary should be displayed
    Then I successfully cancel the trip
