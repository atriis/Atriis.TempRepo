# Test Name: 79477 No NDC search request when corporate content has no active NDC airlines
# Test Case: 79477
# Status: Design
# Labels: Regression,Flights,Amadeus NDC,Search Flight,payload
# Owner: Noam
# Created: 2026-08-28

# Source: ADO Test Case #79477 - [Automated] No NDC search request when corporate content has no active NDC airlines - ADO 75751
# Related: ADO Epic #75751 - [Flights][Administration] GDS NDC - content selection

# ADO Test Case ID: 79477
@ado:79477
@regression @flights @amadeus @amadeus-ndc @payload
Feature: 79477 No NDC search request when corporate content has no active NDC airlines
  As a corporate traveler whose corporate content has no active NDC airlines
  I want to search for flights
  So that no NDC search request is sent for my trip

  Scenario: No NDC search request is sent when corporate content has no active NDC airlines
    Given I am logged in as "noActivated@carrier.club" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "ORD" to "LON"
    And flight results should be available
    When I capture all the "request" types from Storage
    Then the captured "request" types do not contain request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)"
