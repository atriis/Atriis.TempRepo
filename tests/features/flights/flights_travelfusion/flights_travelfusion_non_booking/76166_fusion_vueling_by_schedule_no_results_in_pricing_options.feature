@regression @flights @fusion @by-schedule @priority:critical
Feature: 76166 Fusion By Schedule - Pricing options display fares for both segments
  As a corporate OBT user searching Fusion flights by schedule
  I want pricing options to show available fares for outbound and return segments
  So that I can successfully select and add a Vueling round-trip by-schedule flight to my trip

  Scenario: Vueling round-trip by-schedule search returns pricing options for outbound and return segments
    Given I am logged in as "veulingWeb@TFreg.club" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "OVD" to "AMS"
    And I filter results by carrier "Vueling"
    And I click to open first pricing options
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for the change flight button to be visible
    And I filter results by carrier "Vueling"
    And I click to open first pricing options
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for "Your Selection" text to be visible
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
