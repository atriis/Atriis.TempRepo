# Test Name: 35787 [Merge] LH NDC - All fare rules are selectable and can open the baggage on cart page
# Description:
# Status: Active
# Labels: No Amadeus Hotel Book,Fare Rules,Flights,merge,baggage,Lufthansa NDC Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-12-21T10:14:24Z
# Updated: 2025-10-21T05:05:39Z

@regression @flights @ndc @lufthansa @fare-rules @baggage
Feature: 35787 Lufthansa NDC - All fare rules are selectable and can open baggage on cart page

  As a corporate traveler
  I want to verify all fare rules are selectable in pricing options and baggage is accessible in cart
  So that I can confirm fare rule information and baggage options work correctly

  Scenario: Verify fare rules in pricing options and baggage on cart page for LH NDC business class
    Given I am logged in as "claraaguiar@ndclhclara.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip "Business" class flight from "MUC" to "JFK"
    Then flight results should be available
    When I filter results by carrier "LH"
    When I click to open first pricing options
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I click to open the second fare rules from pricing options modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I select the first option from pricing options
    And I should see the heading "Flight To Munich"
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I click to open the second fare rules from pricing options modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I select the first option from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    When I click to edit the baggage extras section
    Then the baggage carrier should display "Lufthansa"
    When I select a baggage option
    And I click the save button
    Then I should see a success notification