# Test Name: 83094 IB NDC - New Flight Flow - No OfferPrice request is re-sent when flights are added to cart
# Description: Round trip LON-MAD via Iberia NDC. Capture how many OfferPrice requests reached Iberia once the pricing options are displayed, add the selected fares to cart, then verify the count did not grow - the previously retrieved pricing data must be reused.
# Status: Active
# Labels: Regression,Flights,Iberia,IB NDC,New Flight Flow,Payload,OfferPrice,2026 plan 2
# Owner: Sonia Sousa
# Created: 2026-08-13

# ADO Test Case ID: 83094
@ado:83094 @regression @flights @ndc @iberia @nff @payload @offerprice
Feature: 83094 Iberia NDC - New Flight Flow - OfferPrice is not re-sent when flights are added to cart
  As a corporate traveler booking an Iberia NDC round trip
  I want the pricing already retrieved for my selected fares to be reused when I add them to cart
  So that Iberia is not asked to re-price the same offer and the cart shows the price I was quoted

  Scenario: Adding Iberia NDC flights to cart sends no further OfferPrice request
    Given I am logged in as "mike@ndc.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    Then flight results should be available
    When I filter results by carrier "IB"
    And I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    When I capture the number of "OfferPrice" requests sent for the trip
    And I select the outbound first option from pricing options new flight flow
    Then the inbound leg brand cards should be visible
    When I select the inbound first option from pricing options new flight flow
    And I add to cart from pricing options new flight flow
    Then the booking status should be "Pending booking"
    And no additional "OfferPrice" requests should have been sent after "SelectFlight"
    Then I successfully cancel the trip
