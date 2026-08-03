# Test Name: 46673 Amadeus - Flights - Split Rules - Complete Trip - Quote is being splited correctly
# Status: Active
# Labels: Amadeus,Flights,Regression,split rules,Complete trip,GDS,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-02-12T09:51:43Z

@regression @amadeus @flights @split_rules
Feature: 46673 Amadeus - Split rules complete trip quote is split correctly
  As a corporate traveler
  I want to add a multi-carrier flight via complete trip search
  So that the system splits the quote correctly per the split rules configuration

  Scenario: Complete trip flight with split rules produces two separate quotes
    Given I am logged in as "ruimendes@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "BOS" to "DFW"
    And flight results should be available
    And I filter airline results by "Multi carrier" checkbox
    And I filter results by carrier "DL,F9"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the first quote destination should contain "Dallas"
    And the last quote destination should contain "Worcester"