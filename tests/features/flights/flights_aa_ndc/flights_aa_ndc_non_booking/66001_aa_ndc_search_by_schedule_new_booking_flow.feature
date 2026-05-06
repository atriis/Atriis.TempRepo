# Test Name: 66001 AA NDC - Search By Schedule - Corporate Role 'Use New Flight Booking Flow' added
# Description: The privilege 'Must Use Flights Pricing Options' must be assigned to the Booker role in administration.
# Check the role Booker for corporate AA NDC (Sonia Test) in TMC Frosch Sabre Demo.
# UPDATE: The privilege has a new name, now is "Use New Flight Booking Flow"
# Status: Active
# Labels: Regression,results,Role,AA NDC Regression,2026 plan 2
# Owner: Sónia Sousa
# Created: 2025-08-25T04:43:42Z
# Updated: 2025-09-23T01:36:13Z

@to_adjust @flights @aa @ndc @role @schedule
Feature: 66001 AA NDC - Search By Schedule - Corporate Role 'Use New Flight Booking Flow' added

  As a corporate traveler with the 'Use New Flight Booking Flow' privilege
  I want to search for a flight by schedule
  So that pricing options are shown when I click 'Select flight' instead of adding directly to my trip

  Scenario: Results show 'Select flight' button and open pricing options on click
    Given I am logged in as "aandcuser" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "ORD" to "LGA"
    And flight results should be available
    Then the Select Flight button should be visible in results
    And the Add to trip and Pricing Options buttons should not be visible in results
    When I select one flight segment by schedule
    And I select the first option from pricing options
    And I confirm the pricing option for the current segment
    Then the Select Flight button should be visible in results
    And the Add to trip and Pricing Options buttons should not be visible in results
    When I select one flight segment by schedule
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for "Your Selection" text to be visible
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"