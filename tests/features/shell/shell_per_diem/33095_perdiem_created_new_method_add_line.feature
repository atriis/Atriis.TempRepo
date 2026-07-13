# Test Name: 33095 PerDiem created> New Method> add line
# Description: PerDiem created right after user adding a flight and going to the checkout
# user should be able to add line to the table PD
# Status: Active
# Labels: PerDiem,Regression,No Amadeus Hotel Book,progress page,Cancel by process,2026 plan 1
# Owner: pini harush
# Created: 2023-07-11T02:38:28Z
# Updated: 2026-01-19T07:35:20Z

@regression @shell @flights @per_diem
Feature: 33095 - Per-Diem quote created after issuing a flight (new method), line addable
  As a corporate traveler
  I want to add a line to the Per-Diem quote breakdown after issuing a flight
  So that I can record an additional per-diem item against my trip
  
  #Bug
  @priority:critical
  Scenario: Adding a line to the Per-Diem breakdown shows the new line in the breakdown
    Given I am logged in as "new2@pidi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "lon" to "sfo"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    When I expand the Per-Diem quote breakdown
    Then the Per-Diem quote breakdown should be displayed
    When I add a line to the Per-Diem breakdown for destination "bkk" with comment "testim" and deduction "limo"
    And I expand the Per-Diem quote breakdown
    Then the Per-Diem breakdown should contain "limo"
