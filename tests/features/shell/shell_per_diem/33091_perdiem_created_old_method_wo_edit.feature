# Test Name: 33091 [merged] PerDiem created> Old Method> W/O edit
# Description: PerDiem created after user issue flight
# user should not be able to edit the PD quote
# Status: Active
# Labels: PerDiem,Regression,No Amadeus Hotel Book,Full Purchase,Flights,merge,v3,progress page,Cancel by process,2026 plan 1
# Owner: pini harush
# Created: 2023-07-11T02:38:28Z
# Updated: 2026-01-19T07:34:15Z

@regression @shell @flights @per_diem
Feature: 33091 - Per-Diem quote created after issuing a flight (old method), quote not editable
  As a corporate traveler
  I want a Per-Diem quote to be generated automatically once I issue a flight booking
  So that my per-diem allowance is recorded on the trip and locked from editing

  @priority:critical
  Scenario: Per-Diem quote is created and confirmed after booking a flight, and cannot be edited
    Given I am logged in as "uri@pidi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "lon" to "mad"
    And I filter results by carrier "british airways"
    And I add the first flight to cart
    And I proceed to checkout
    And I complete the booking
    And the Per-Diem quote status should be "Confirmed"
    And the Per-Diem quote should not be editable
