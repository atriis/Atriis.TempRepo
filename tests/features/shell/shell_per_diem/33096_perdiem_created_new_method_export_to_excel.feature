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
    And I complete the booking
    And the Per-Diem quote status should be "Confirmed"
    When I expand the Per-Diem quote breakdown
    Then the Per-Diem quote breakdown should be displayed
    When I export the Per-Diem quote to Excel
    Then the Per-Diem quote Excel file should be downloaded
