# Test Name: 33093 [Merged] PerDiem created> New Method W/O edit or add line
# Description: PerDiem created right after user adding a flight and going to the checkout
# user should not be able to add or edit PD line
# Status: Active
# Labels: PerDiem,Regression,No Amadeus Hotel Book,merge,Full Purchase,Flights,progress page,Cancel by process,2026 plan 1
# Owner: pini harush
# Created: 2023-07-11T02:38:28Z
# Updated: 2026-01-19T07:35:24Z

@regression @shell @flights @per_diem
Feature: 33093 - Per-Diem quote created after issuing a flight (new method), line not editable or addable
  As a corporate traveler
  I want the Per-Diem quote generated after I issue a flight to be read-only
  So that I cannot edit an existing line or add a new line to an automatically created Per-Diem quote

  @priority:critical
  Scenario: Per-Diem quote breakdown cannot be edited or have lines added after booking
    Given I am logged in as "new@pidi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "lon" to "mad"
    And I filter results by carrier "british airways"
    And I add the first flight to cart
    When I proceed to checkout
    And I complete the booking
    And the Per-Diem quote status should be "Confirmed"
    And the Per-Diem quote should not be editable
    When I expand the Per-Diem quote breakdown
    Then the Per-Diem quote breakdown should be displayed
    And the Per-Diem breakdown should not be editable
    And it should not be possible to add a Per-Diem line
