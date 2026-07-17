# Test Name: 79393 Amadeus EDIFACT - Fare rules parsed correctly per leg in pricing options
# Description: Amadeus EDIFACT round trip - when the traveler opens Pricing Options, the change AND
#              cancellation rules shown for each leg must reflect that leg's fare rules from the supplier
#              response (e.g. NOF -> "Non-refundable" / "Changes not allowed"), and must NOT fall back to
#              the generic "check fare rules" indicator when the supplier provides a conclusive rule.
#              Cross-checked per leg against the intercepted flightPricing response.
# Status: Active
# Labels: Amadeus,EDIFACT,Flights,Fare Rules,Pricing Options,Non-Booking

# ADO Test Case ID: 80994
@ado:80994
@regression @flights @provider:amadeus @fare-rules @edifact
Feature: 79393 Amadeus EDIFACT - Change and cancellation rules parsed per leg in pricing options
  As a corporate traveler booking an Amadeus EDIFACT round trip
  I want each leg's change and cancellation rules in Pricing Options to reflect that leg's fare rules
  So that every leg shows its parsed rule instead of the generic "check fare rules" fallback

  @priority:high
  Scenario: Round trip LIS-LON change and cancellation rules per leg match the supplier fare rules, not the generic fallback
    Given I am logged in as "corp.amadeus.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "LON"
    And I filter results by carrier "TAP"
    And I start intercepting the flight pricing selection response
    And I select the first flight result in new flight flow
    Then the change and cancellation rules for each brand card leg should match that leg's fare rules in the intercepted pricing response
    When I select the outbound first option from pricing options new flight flow
    Then the change and cancellation rules for each brand card leg should match that leg's fare rules in the intercepted pricing response
