# Test Name: 66005 AA NDC - Complete Trip - Corporate Role 'Use New Flight Booking Flow' added
# Description: The privilege 'Must Use Flights Pricing Options' must be assigned to the Booker role in administration.
# Check the role Booker for corporate AA NDC (Sonia Test) in TMC Frosch Sabre Demo.
# UPDATE: The privilege has a new name, now is "Use New Flight Booking Flow"
# Status: Active
# Labels: Regression,results,Role,Complete trip,AA NDC Regression,Pre Prod,2026 plan 2
# Owner: Sónia Sousa
# Created: 2025-08-25T06:21:29Z
# Updated: 2025-09-23T01:40:42Z

@to_adjust @flights @aa @ndc @role
Feature: 66005 AA NDC - Complete Trip - Corporate Role 'Use New Flight Booking Flow' added

  As a corporate traveler with the 'Use New Flight Booking Flow' privilege
  I want to book a round trip AA NDC flight
  So that I must go through pricing options to complete the booking for both outbound and inbound legs

  Scenario: Complete a round trip booking via pricing options with the 'Use New Flight Booking Flow' role
    Given I am logged in as "aandcuser@soniatest.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "ORD" to "AMS"
    And flight results should be available
    Then the Select Flight button should be visible in results
    And the Add to trip and Pricing Options buttons should not be visible in results
    #Same selector for "Select flight" and "Select", that's why this function was reused here
    When I select one flight segment by schedule
    And I select the first option from pricing options
    Then I should see the heading "Flight To Chicago"
    And I select the first option from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"