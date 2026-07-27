# Test Name: Fusion Vueling - Verify fare rules across entry points using by-schedule search
# Status: Active
# Labels: Regression,Flights,Fusion,Vueling,by schedule,Fare Rules
# Owner: Bruna Santos

@regression @flights @fusion @vueling @by-schedule @fare-rules
Feature: 74219 Fusion Vueling - Verify fare rules using by-schedule search
  As a corporate traveler searching a Fusion Vueling flight by schedule
  I want fare rules to be visible at every entry point in results, pricing options and cart
  So that the strictest terms note is consistently displayed throughout the booking flow

  Scenario: Verify fare rules in every entry point for a Fusion Vueling by-schedule search
    Given I am logged in as "veulingWeb@TFreg.club" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "BCN" to "LIS"
    And flight results should be available
    And I filter results by carrier "Vueling"
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I click to open first pricing options
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    Then I close pricing options modal
    When I click to open flight details
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    When I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And flight results should be available
    And I filter results by carrier "Vueling"
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I click to open first pricing options
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    Then I close pricing options modal
    When I click to open flight details
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    When I select one flight segment by schedule
    And I wait for "Your Selection" text to be visible
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"