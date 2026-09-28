# Test Name: 85483 Reference Fields dropdown answers auto sorted alphabetically
# Status: Design

# ADO Test Case ID: 85483
@ado:85483 @shell @reference_fields @regression
Feature: 85483 - Reference field dropdown answers are sorted alphabetically

  As a booker
  I want the answers of a reference field dropdown to be listed alphabetically
  So that I can find the answer I need quickly

  Scenario: New trip reference field dropdown lists its answers in alphabetical order
    Given I am logged in as "pax@pax12.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    Then the "New trip reference fields" popup should be displayed
    When I open the reference field dropdown
    Then the reference field dropdown options should be sorted alphabetically
