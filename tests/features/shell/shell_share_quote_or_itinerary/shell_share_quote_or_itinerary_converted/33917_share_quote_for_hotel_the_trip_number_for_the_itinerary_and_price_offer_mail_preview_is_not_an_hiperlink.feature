# Test Name: 33917 Share quote for hotel: the trip number for the itinerary and price offer mail preview is not an hiperlink
# Description:
# Status: Active
# Labels: CR7,Regression,No Amadeus Hotel Book,Fit for Prod,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-09T04:23:36Z
# Updated: 2025-07-21T10:33:12Z

@regression @shell
Feature: Share quote for hotel - trip number is not a hyperlink in the mail previews

  As a user sharing a hotel quote and itinerary
  I want the trip number shown in the price offer and itinerary email previews to be plain text
  So that the trip number is not rendered as a hyperlink

  Scenario: Trip number is not a hyperlink in the hotel share quote and share itinerary email previews
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I wait to see view rates text in results page
    And I select the first hotel result
    # TODO: no catalog phrase for selecting multiple room quotes to share from room-level results and opening the share quotes email preview
    And I select two rooms to share and open the share quotes email preview
    # TODO: no catalog phrase for validating the trip number is not a hyperlink in the share quote email preview (core assertion of the test)
    Then the trip number in the share quote email preview should not be a hyperlink
    When I add the first available room to my cart
    And I handle conflicting quotes if visible
    Then the cart status should be Pending booking
    When I click the share itinerary button
    # TODO: no catalog phrase for validating the trip number is not a hyperlink in the share itinerary email preview (core assertion of the test)
    Then the trip number in the share itinerary email preview should not be a hyperlink
    When I close the share dialog
    Then I successfully cancel the trip
