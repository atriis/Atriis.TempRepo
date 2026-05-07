# Test Name: 66002 IB NDC - Search By Schedule - Corporate Role 'Must use flights pricing options' added
# Description: The privilege 'Must Use Flights Pricing Options' must be assigned to the Booker role in administration.
# Status: Active
# Labels: Regression,results,Role,NDC,2026 plan 2
# Owner: Sónia Sousa
# Created: 2025-08-25T05:05:22Z
# Updated: 2025-08-25T05:22:11Z

@regression @flights @iberia @ndc @role @schedule
Feature: 66002 IB NDC - Search By Schedule with 'Must Use Flights Pricing Options' role
  As a corporate traveler with the 'Must Use Flights Pricing Options' privilege
  I want pricing options to be displayed on the Select Flight click for both legs
  So that I can pick a fare for outbound and inbound before adding to my trip
  
  #BLOCKED - no results, could not test the entire scenario 
  Scenario: Round trip by schedule shows pricing options on Select Flight for outbound and inbound
    Given I am logged in as "ibndc_soniatest" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "MAD" to "BCN"
    And flight results should be available
    Then the Select Flight button should be visible in results
    And the Add to trip and Pricing Options buttons should not be visible in results
    When I select one flight segment by schedule
    Then I should see the heading "Pricing Options"
    When I select the first option from pricing options
    And I add to trip from pricing options
    Then the Select Flight button should be visible in results
    And the Add to trip and Pricing Options buttons should not be visible in results
    When I select one flight segment by schedule
    Then I should see the heading "Pricing Options"
    When I select the first option from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
