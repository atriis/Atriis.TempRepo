# Test Name: 82014 Flights - Sabre both EDIFACT and NDC content displayed in pricing options
# Status: Draft
# Labels: Regression,Flights,Sabre,Sabre NDC,results,Pricing Options

# ADO Test Case ID: 82014
# ADO workitem: 75701
@regression @flights @sabre @sabre-ndc @results @ado:75701 @ado:82014
Feature: 82014 Flights - Sabre both EDIFACT and NDC content displayed in pricing options
  As a corporate traveler whose corporate is enabled for both NDC and EDIFACT content
  I want the pricing options to offer both EDIFACT and NDC fares for the same brand
  So that NDC content does not replace EDIFACT content as the only bookable option

  Scenario: Sabre pricing options display both EDIFACT and NDC fares for a Qantas AKL-SYD round trip
    Given I am logged in as "sabreCorp@fro.sch" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "AKL" to "SYD"
    And I wait for add to trip text to be visible
    And I filter airline results by "Qantas" checkbox
    When I click to open first pricing options
    # The bug returned NDC content only, hiding the EDIFACT fare for the same brand
    Then both edifact and NDC results are displayed
