@regression @flights @sabre @payload @results @ado:78326 @ado:78506
Feature: 78506 Sabre - RevalidateItinerary and NDC Offer Price sent on select flight (LAX-DEN, United)
  As a corporate traveler booking a Sabre United round trip
  I want RevalidateItinerary and the NDC Offer Price call to be sent when I pick a fare
  So that the priced quote reflects a re-validated itinerary instead of a stale search price
#NDC Offer Price not being sent
  Scenario: RevalidateItinerary and NDC Offer Price are sent when selecting a United Sabre flight
    Given I am logged in as "revalidateItin@sabre.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LAX" to "DEN"
    Then flight results should be available
    When I filter results by "No stops" checkbox
    And I filter airline results by "United" checkbox
    When I select the first flight result in new flight flow
    And I select the outbound first option from pricing options page
    And I select the inbound first option from pricing options page
    And I add to cart from pricing options page
    #The capture step is a presence assertion
    Then I capture the "request" payload for request type "*RevalidateItinerary*" from Storage
    And I capture the "request" payload for request type "*NDC Offer Price*" from Storage
