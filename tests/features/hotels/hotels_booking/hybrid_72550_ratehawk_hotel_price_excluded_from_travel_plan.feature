# Test Name: HYBRID for 72550 Exclude Hotel Price From Travel Plan Email
# Description: 
# Status: Active
# Labels: Share Itinerary,Email,Hotel,Ratehawk Regression,Full Purchase,2026 plan 2
# Owner: Shani Hadar
# Created: 2026-01-14T06:58:05Z
# Updated: 2026-01-15T08:33:43Z

@regression @provider:ratehawk
Feature: 72550 Ratehawk - Hotel price is excluded from the travel plan email
  As a corporate traveler
  I want the hotel price to be excluded from the shared travel plan email
  So that recipients only see itinerary details without pricing information

  @priority:medium
  Scenario: Hotel price is not included when sharing the travel plan itinerary
    Given I am logged in as "tal" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    And I wait to see view rates text in results page
    When I sort hotel results by "Price"
    And I select the first hotel result
    And I add a refundable room to my cart
    And I log the trip number from the URL
    Then the booking status should be "Pending booking"
    When I click the share itinerary button
    Then the travel plan email should not include the hotel price
    And I send the share
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"

