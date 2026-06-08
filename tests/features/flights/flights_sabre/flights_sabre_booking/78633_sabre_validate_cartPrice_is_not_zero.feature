# Test Name: 78633 Sabre - Hold flight EWR to LHR with price validation
# Status: Active
# Labels: Regression,Flights,Sabre,hold,price validation
# Owner: Noam Miller
# Created: 2026-06-04T00:00:00Z
# Updated: 2026-06-04T00:00:00Z

@regression @flights @sabre @hold @price-validation
Feature: 78633 sabre_validate_cartPrice_is_not_zero
  As a corporate traveler
  I want to hold a non-lowest Sabre fare from EWR to LHR
  So that the price after hold is valid and any price change is genuine

  Scenario: Sabre hold flight EWR to LHR validates price change modal and hold status
    Given I am logged in as "priceNot0@corp.frosch" booking a new trip
    And I have added a random guest traveler with phone type "Cellular phone"
    When I search for a one way flight from "EWR" to "LHR"
    And flight results should be available
    And I filter results by "No stops" checkbox
    And I filter results by carrier "United"
    And I click to open first pricing options
    And I select the second fare from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I click hold flight button
    And I validate price change if displayed and proceed
    Then the booking status should be "On hold"
    And the trip total to pay should not be zero
    Then I successfully cancel the trip
