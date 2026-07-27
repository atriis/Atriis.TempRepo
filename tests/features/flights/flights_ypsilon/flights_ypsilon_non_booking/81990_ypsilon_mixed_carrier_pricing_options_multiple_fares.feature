# Test Name: 81990 Ypsilon and Amadeus mixed carrier quote, Displaying all pricing options per leg
# ADO Test Case ID: 81990
# ADO workitem ID: 77325
# Status: Active
# Labels: Regression,Flights,Ypsilon,Amadeus,multicarrier,Pricing Options
# Owner: Noam Miller

@regression @flights @ypsilon @multi-carrier @pricing-options @ado:81990
Feature: 81990 Ypsilon and Amadeus mixed carrier quote, Displaying all pricing options per leg
  As a corporate traveler booking a mixed Amadeus GDS / Ypsilon itinerary
  I want every fare family to be offered on both legs of the Pricing Options drawer
  So that I am not limited to the carrier's basic (Saver / BASIC) fare

  @priority:high
  Scenario: Ypsilon and Amadeus mixed carrier quote, Displaying all pricing options per leg
    Given I am logged in as "mixed@supplier.club" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "DUB" to "LON"
    Then flight results should be available
    # "Multi carrier" is the comparison-grid column that combines the Ypsilon (EI) and Aamdeus (FR) legs
    When I select the "Multi carrier" carrier logo from the comparison table
    Then the airline checkbox "Multi carrier" should be checked
    And flight results should be available
    When I select the first flight result in new flight flow
    And I wait for the outbound leg in pricing options page
    # Outbound (Aer Lingus): the bug returned the Saver fare only
    Then the pricing options leg should offer more than one fare
    When I select a random outbound fare from pricing options page
    And I wait for the inbound leg in pricing options page
    # Return (Ryanair): the bug returned the BASIC fare only, whatever fare family was picked
    Then the pricing options leg should offer more than one fare
