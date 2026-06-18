# Test Name: 75751 Sabre NDC + EDIFACT active carriers send correct search requests
# Test Case: 79482
# Status: Active
# Labels: Regression,Flights,Sabre NDC,EDIFACT,Search Flight,payload
# Owner: Noam
# Created: 2026-06-18

@regression @flights @sabre @sabre-ndc @payload @ado:79482
Feature: 79482 Sabre NDC and EDIFACT active carriers in corporate content send correct search requests
  As a corporate traveler whose corporate content has both NDC and EDIFACT active carriers
  I want to search for flights
  So that NDC carriers appear as NDC results and EDIFACT carriers appear as non-NDC results,
  and the Sabre NDC search request only includes the active NDC carrier codes

  Scenario: Active NDC and EDIFACT carriers send correct search requests and results are labeled accordingly
    Given I am logged in as "selected@carriers.frossch" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "ORD" to "WAW"
    And flight results should be available
    And I filter results by carrier "LOT"
    Then all visible flight results should have the "NDC direct rate" label
    When I click to open first pricing options
    Then all fares in pricing options should have the "NDC direct rate" indicator
    And I close pricing options modal
    And I filter results by carrier "KLM"
    Then all visible flight results should have the "NDC direct rate" label
    When I click to open first pricing options
    Then all fares in pricing options should have the "NDC direct rate" indicator
    And I close pricing options modal
    And I filter results by carrier "UA"
    Then all visible flight results should not have the "NDC direct rate" label
    When I click to open first pricing options
    Then all fares in pricing options should not have the "NDC direct rate" indicator
    And I close pricing options modal
    When I capture the "request" payload for request type "Sabre NDC Flight Search" from Storage
    Then the captured "request" payload for request type "Sabre NDC Flight Search" should contain "vendorPref"
    And the captured "request" payload for request type "Sabre NDC Flight Search" should contain "KL"
    And the captured "request" payload for request type "Sabre NDC Flight Search" should contain "LO"
    And the captured "request" payload for request type "Sabre NDC Flight Search" should not contain "UA"
    And the captured "request" payload for request type "Sabre NDC Flight Search" should not contain "AF"
    And the captured "request" payload for request type "Sabre NDC Flight Search" should not contain "AA"
