@regression @flights @sabre @nff @share-itinerary @email @priority:critical @ado:86267
Feature: 86267 Sabre - Travel Plan email subjects the final destination instead of the connecting stop
  As a corporate traveler sharing the itinerary of a connecting Sabre flight
  I want the Travel Plan email subject to name the trip's final destination
  So that the recipient is not told the trip ends at a connecting stop

  Scenario: Travel Plan email subject names the final destination of a 2-stop flight
    Given I am logged in as "nffSothwest@tlg.corp" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "AMS" to "RMO"
    And flight results should be available
    And I filter results by "2 stops" checkbox
    When I select the first flight result in new flight flow
    And I select the outbound first option from pricing options new flight flow
    And I add to cart from pricing options new flight flow
    Then the booking status should be "Pending booking"
    When I click the share itinerary button
    Then the itinerary email subject should contain "to Chisinau, Republic of Moldova APT, MD (RMO)"
