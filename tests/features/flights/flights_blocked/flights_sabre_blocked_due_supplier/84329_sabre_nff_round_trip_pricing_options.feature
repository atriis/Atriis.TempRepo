@flights @sabre @nff
Feature: 84329 Sabre - Complete a round trip search and add to cart via pricing options with the new flight flow

  As a corporate traveler
  I want to search and add to cart a round trip flight via pricing options with the new flight flow
  So that I must go through pricing options to complete the search for both outbound and inbound legs

  Scenario: 84329 Sabre - Complete a round trip search and add to cart via pricing options with the new flight flow
    Given I am logged in as "corp.sabre.nff@frosch.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LIS" to "LON"
    And flight results should be available
    Then the Select Flight button should be visible in results
    And the Add to trip and Pricing Options buttons should not be visible in results
    When I select the first flight result in new flight flow
    And I select the outbound first option from pricing options new flight flow
    And I select the inbound first option from pricing options new flight flow
    And I add to cart from pricing options new flight flow
    Then the booking status should be "Pending booking"
