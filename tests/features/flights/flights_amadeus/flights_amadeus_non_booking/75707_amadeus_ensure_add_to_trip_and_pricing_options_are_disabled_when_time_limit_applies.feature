@regression @priority:medium @provider:amadeus @flights
Feature: 75707 Add to Trip is disabled and Pricing Options are not selectable when Time Limit applies
  As a corporate traveler
  I want to search for flights when time limit is configured
  So Add to Trip is disabled and Pricing Options are not selectable

  Scenario: Add to Trip is disabled and Pricing Options are not selectable when Time Limit applies
    Given I am logged in as "timelimit.amadeus@club.com" booking a new trip
    And I have added myself as the traveler
    And I search for a round trip flight from "LON" to "MAD"
    And I wait for add to trip text to be visible
    Then all results should have "Add to trip" button disabled
    And the "Pricing Options" button should be enabled
    And I click to open first pricing options
    Then all pricing options should be disabled
