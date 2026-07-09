# Test Name: 78895 AFKL - Correct fare rule display for separate tickets different fares
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,Fare Rules,Separate Tickets,By Schedule

@regression @flights @afkl @ndc @fare-rules @separate-tickets @by-schedule
Feature: 78895 AFKL - Correct fare rule display for separate tickets different fares
  As a corporate traveler
  I want to book an AFKL round trip by schedule selecting different fares per leg
  So that the fare basis codes for outbound and return are confirmed to be different

  Scenario: Standard outbound and Flex return produce different fare basis codes
    Given I am logged in as "afklRules@ams.corp" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "AMS" to "YUL"
    And flight results should be available
    When I select one flight segment by schedule
    And I select the pricing option containing "Standard"
    And I confirm the pricing option for the current segment
    When I select one flight segment by schedule
    And I select the pricing option containing "Flex"
    And I confirm the pricing option for the current segment
    Then the "Separated Tickets" indicator should be visible in the pricing page
    When I click to open fare rules
    Then I should see the fare rules note about strictest terms
    Then the fare basis codes on the first and second tabs should differ
