# Test Name: 78326 Sabre - RevalidateItinerary and SabreNdcOfferPrice sent on select flight (LAX-DEN, United)
# Status: Active
# Labels: Regression,Flights,Sabre,Payload Validation,results,Select Flight,2026 plan 2
# Owner: Noam Miller
# Created: 2026-06-03

@regression @flights @sabre @payload-validation @ado:78326 @priority:high
Feature: 78326 Sabre - RevalidateItinerary and SabreNdcOfferPrice sent on select flight (LAX-DEN, United)
  As a corporate traveler
  I want to search a round trip flight and select a United Sabre result
  So that RevalidateItinerary and SabreNdcOfferPrice requests are correctly sent to Sabre

  Scenario: RevalidateItinerary and SabreNdcOfferPrice are sent when selecting a United Sabre flight
    Given I am logged in as "revalidateItin@sabre.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LAX" to "DEN"
    And flight results should be available
    And I filter results by "No stops" checkbox
    And I filter airline results by "United" checkbox
    When I select one flight segment by schedule
    And I select the outbound first option from pricing options new flight flow
    When I capture the "request" payload for request type containing "RevalidateItinerary" from Storage
    And I capture the "request" payload for request type containing "NDC Offer Price" from Storage
