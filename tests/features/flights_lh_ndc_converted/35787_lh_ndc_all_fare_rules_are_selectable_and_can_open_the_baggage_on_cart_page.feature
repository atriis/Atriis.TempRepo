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
    Given I am logged in as "clara" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip "Business" class flight from "MUC" to "JFK"
    Then flight results should be available
    When I filter results by carrier "LH"

    # Open pricing options
    When I click to open first pricing options

    # Verify all fare rules are selectable and add to cart
    # TODO: Implement step "all fare rules in pricing options should be selectable" — click fare rules button on option 1, verify 'Please note:' text, close; click fare rules on option 2, verify, close; click fare rules link on option 2, verify, close; then select option 1 and add to trip
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"

    # Verify baggage is accessible on cart page
    When I click to edit the baggage extras section
    # TODO: Implement step "the baggage carrier should display {string}" — verify '.form-date-section > :nth-child(1) > :nth-child(1) .carrier-name' contains 'Lufthansa'
    # TODO: Implement step "I select a baggage option and save" — click collapse icon, select baggage dropdown option, click save button, verify success toast, verify '.flight-baggage .filled' is visible
