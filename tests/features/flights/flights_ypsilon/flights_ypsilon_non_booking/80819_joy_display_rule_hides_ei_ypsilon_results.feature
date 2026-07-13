# Test Name: 80819 Ypsilon - Flight - Joy Display Rule hides EI (Aer Lingus) results sourced from YPSILON
# ADO Test Case ID: 80819
# Status: Active
# Labels: Regression,Flights,Ypsilon,display rules,Joy,2026 plan 2

@regression @flights @ypsilon @display-rules @ado:79345
Feature: 80819 Joy Display Rule hides EI results from YPSILON (Amadeus-sourced EI remain)
  As a corporate traveler whose Joy display rule hides Aer Lingus (EI) from the YPSILON source
  I want YPSILON-sourced Aer Lingus results hidden while Amadeus-sourced Aer Lingus results remain
  So that the "Carrier = EI AND Source System = YPSILON -> Hide Result" rule is enforced

  @priority:high
  Scenario: Aer Lingus (EI) results shown are Amadeus-sourced; none come from YPSILON (DUB-BRU)
    Given I am logged in as "corp@ypsilon394.club" booking a new trip
    And I have added myself as the traveler
    And I start intercepting the "flightSearch" API response
    When I search for a round trip flight from "DUB" to "BRU"
    Then flight results should be available
    # Aer Lingus (EI) is still shown in the results, sourced from Amadeus
    And I filter results by carrier "EI"
    And flight results should be available
    # ...but no EI result in the search response comes from YPSILON (officeId "Ypsilon Club") — hidden by the rule
    And the flight search response should have no "EI" result from source system "YPSILON"
