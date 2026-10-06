@regression @flights @sabre @nff @pricing-options @priority:critical @ado:86259
Feature: 86259 Sabre - New Flight Flow - single pax price on the pricing page matches the cart total
  As a corporate traveler booking a Sabre round trip for myself in the new flight flow
  I want the price the pricing page footer shows per traveller to be the price charged in the cart
  So that the fare I picked is the fare I am asked to pay

  Scenario: Footer price per traveller for a single traveller equals the cart total
    Given I am logged in as "nffSothwest@tlg.corp" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "BCN" to "VIE"
    And flight results should be available
    When I select the first flight result in new flight flow
    And I select the outbound first option from pricing options new flight flow
    And I select the inbound first option from pricing options new flight flow
    And I extract the price per traveller from the flight selection footer
    And I add to cart from pricing options new flight flow
    Then the booking status should be "Pending booking"
    And the cart total price should match the last extracted price
