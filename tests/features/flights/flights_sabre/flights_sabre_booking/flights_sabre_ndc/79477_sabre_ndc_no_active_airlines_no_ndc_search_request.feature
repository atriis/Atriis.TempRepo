# Test Name: 79477 Sabre NDC - No active NDC airlines in corporate content, NDC search request is not sent
# Test Case: 79477
# Status: Design
# Labels: Regression,Flights,Sabre NDC,Search Flight,payload
# Owner: Noam
# Created: 2026-08-28

# Source: ADO Test Case #79477 - [Automated] When no active airlines in corporate content ndc we don't send ndc search request
# Related: ADO Epic #75751 - [Flights][Administration] GDS NDC - content selection

# ADO Test Case ID: 79477
@ado:79477
@regression @flights @sabre @sabre-ndc @payload
Feature: 79477 Sabre NDC - No NDC search request when corporate content has no active NDC airlines
  As a corporate traveler whose corporate content has no active NDC airlines
  I want to search for flights
  So that no Sabre NDC search request is sent for my trip

  Scenario: No NDC search request is sent when corporate content has no active NDC airlines
    Given I am logged in as "noActiveNdc@frosch.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "ORD" to "LON"
    And flight results should be available
    When I capture all the "request" types from Storage
    Then the captured "request" types do not contain request type "Sabre NDC Flight Search*"
