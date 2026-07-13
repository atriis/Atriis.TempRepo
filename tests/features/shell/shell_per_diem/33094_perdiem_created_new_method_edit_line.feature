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
    And I complete the booking
    When I expand the Per-Diem quote breakdown
    Then the Per-Diem quote breakdown should be displayed
    When I edit the Per-Diem breakdown line adding a "mini bar" deduction
    Then the Per-Diem breakdown should contain "mini bar"
