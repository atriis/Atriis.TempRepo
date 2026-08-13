# Test Name: 83071 Sabre - New Flight Flow - Premium Economy cabin class and Premium brands displayed
# Status: Active
# Labels: Regression,Flights,Sabre,New Flight Flow,Pricing Options,Premium Economy

# ADO Test Case ID: 83071
# ADO workitem: 82024
@regression @flights @sabre @provider:sabre @nff @pricing-options @priority:high @ado:82024 @ado:83071
Feature: 83071 Sabre - New Flight Flow - Premium Economy displayed in pricing options
  As a corporate traveler searching Sabre content in the new flight flow
  I want the Premium cabin class to be offered and to list Premium branded fares
  So that I can pick a premium economy fare instead of being limited to economy brands

  Scenario: Premium cabin class tab is offered and lists Premium brands for a KLM AMS-IAD round trip
    Given I am logged in as "nffSabre@corp.club" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "AMS" to "IAD"
    Then flight results should be available
    And I filter results by carrier "KLM"
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    # The cabin class tabs above the brand cards must offer Premium next to Economy and Business
    And the "Premium" cabin class tab should be displayed in flight selection
    When I select the "Premium" cabin class tab in flight selection
    Then every outbound leg brand card name should contain "Premium"
