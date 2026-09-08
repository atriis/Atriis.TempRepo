# Test Name: 81288 [OBT] Sabre - Send a request for SEA fares on click Additional Pricing Options
# Status: Design
# Labels: Regression,Flights,Sabre,Marine Fares,Pricing Options,payload

# ADO Test Case ID: 81288
# ADO workitem: 78265
@regression @flights @sabre @marine-fares @payload @results @ado:78265 @ado:81288
Feature: 81288 Sabre - SEA fares requested on click pricing options
  As a corporate traveler entitled to a SEA (marine) agreement
  I want opening the pricing options to ask Sabre for SEA fares
  So that the marine fare quotes are priced and displayed instead of published fares only

  Scenario: SEA fares are displayed and requested from Sabre when opening pricing options
    Given I am logged in as "southwest@corp.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "DXB" to "HKG"
    Then flight results should be available
    When I filter results by "Marine fare" checkbox
    # This user is on the new flight flow: results offer "Select flight", not a Pricing Options button
    When I select the first flight result in new flight flow
    And I wait for the outbound leg in pricing options page
    When I capture the "request" payload for request type "*RevalidateItinerary*" from Storage
    Then the captured "request" payload for request type "*RevalidateItinerary*" should contain "PassengerTypeQuantity Code=\"SEA\""
    And the captured "request" payload for request type "*RevalidateItinerary*" should contain "XOFares Value=\"true\""
