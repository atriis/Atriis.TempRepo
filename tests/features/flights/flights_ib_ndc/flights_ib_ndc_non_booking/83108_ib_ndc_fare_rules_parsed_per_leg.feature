# Test Name: 83108 IB NDC - New Flight Flow - Cancellation and change rules parsed correctly per leg
# Description: Iberia NDC round trip LIS-AMS - when the traveler opens Pricing Options, each leg's
#              cancellation and change badges must reflect that leg's fare rules from the supplier
#              response (RefundableInd=false -> "Non-refundable"; ChangeFee with a penalty above zero
#              -> change allowed with a fee), and must never fall back to the generic
#              "check fare rules" indicator. Cross-checked per leg against the intercepted
#              FlightPricingSelection response.
# Status: Active
# Labels: Regression,Flights,Iberia,IB NDC,New Flight Flow,Fare Rules,Pricing Options,Non-Booking
# Owner: Sonia Sousa
# Created: 2026-08-14

# ADO Test Case ID: 83108
@ado:83108 @regression @flights @ndc @iberia @nff @fare-rules
Feature: 83108 Iberia NDC - New Flight Flow - Change and cancellation rules parsed per leg in pricing options
  As a corporate traveler booking an Iberia NDC round trip
  I want each leg's cancellation and change rules in Pricing Options to reflect that leg's fare rules
  So that I can trust what I am told about refunds and change fees before I commit to a fare

  @priority:high
  Scenario: Round trip LIS-AMS cancellation and change rules per leg match the supplier fare rules, not the generic fallback
    Given I am logged in as "mike@ndc.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "AMS" with preferred carrier "IB"
    Then flight results should be available
    When I start intercepting the flight pricing selection response
    And I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And the change and cancellation rules for each brand card leg should match that leg's fare rules in the intercepted pricing response
    When I select the outbound first option from pricing options new flight flow
    Then the inbound leg brand cards should be visible
    And the change and cancellation rules for each brand card leg should match that leg's fare rules in the intercepted pricing response
