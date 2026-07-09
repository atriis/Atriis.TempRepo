# Test Name: 32088 Share itinerary - "Copy to clipboard" is not redirecting to a broken link
# Description:
# Status: Active
# Labels: Share Itinerary,Regression,Cart,No Amadeus Hotel Book,Daily Shell,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-19T02:43:43Z
# Updated: 2023-06-19T03:25:32Z

@regression @shell @share-itinerary @cart
Feature: 32088 - Share itinerary - "Copy to clipboard" is not redirecting to a broken link
  As a travel arranger
  I want the "Copy to clipboard" action in the Share Itinerary dialog to produce a valid link
  So that the copied itinerary link does not redirect to a broken page

  @priority:medium
  Scenario: Copying the itinerary link to clipboard produces a valid, non-broken link
    Given I am logged in as "testim@prof.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "TLV"
    And I add the first flight to cart
    And I click the share itinerary button
    And I click the copy to clipboard button in the share dialog
    And I should not be redirected to another page
