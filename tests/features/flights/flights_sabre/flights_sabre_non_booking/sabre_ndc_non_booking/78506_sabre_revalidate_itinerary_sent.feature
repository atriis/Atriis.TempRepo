@regression @flights @sabre @payload @results @ado:78326 @ado:78506
Feature: 78506 Sabre - RevalidateItinerary sent on select flight
  As a corporate traveler booking a Sabre United round trip
  I want RevalidateItinerary call to be sent when I pick a fare
  So that the priced quote reflects a re-validated itinerary instead of a stale search price

  Scenario: RevalidateItinerary sent when selecting a United Sabre flight
    Given I am logged in as "brunasabre@froschbrunaautomationinvoice.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LAX" to "DEN"
    Then flight results should be available
    When I filter results by "No stops" checkbox
    And I filter airline results by "United" checkbox
    When I select the first flight result in new flight flow
    And I select the outbound first option from pricing options new flight flow
    #The capture step is a presence assertion
    Then I capture the "request" payload for request type "*RevalidateItinerary*" from Storage
