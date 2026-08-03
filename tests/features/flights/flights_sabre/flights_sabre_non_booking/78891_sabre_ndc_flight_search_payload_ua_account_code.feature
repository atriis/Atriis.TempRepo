# Test Name: 78891 Sabre UA NDC Corporate Rate - Flight search returns results with corporate account code
# Test Case: 78891
# Status: Active
# Labels: Regression,Flights,Sabre NDC,Froco,Search Flight,payload,2026 plan 2
# Owner: Yael
# Created: 2026-06-07

# Source: ADO User Story #66639 - [Flights] Sabre UA NDC corporate rate

# ADO Test Case ID: 78891
@ado:78891
@regression @flights @sabre @sabre-ndc @payload
Feature: 78891 Sabre UA NDC - Corporate rate flight search returns results for Froco user
  As a Froco corporate traveler with a Sabre NDC UA agreement
  I want to search for round trip flights via Sabre NDC with my corporate account code
  So that I receive UA NDC corporate rates in the flight results

  # Covers TC-004: Round-trip Sabre UA NDC flight search with corporate account code
  # AccountCodes field (not deprecated AccountCode) is sent in the Sabre NDC AirShoppingRQ
  # Corporate account code: aaaaaa, Carrier: UA
  Scenario: Round-trip Sabre UA NDC search with corporate account code returns flight results
    Given I am logged in as "Shani@Froco.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "EWR" to "LAX"
    Then flight results should be available
    When I capture the "request" payload for request type "Sabre NDC Flight Search" from Storage
    Then the captured "request" payload for request type "Sabre NDC Flight Search" should contain "aaaaaa".onKey("Code")
