# Test Name: 69254 Galileo - Flight - Frequent Flyer number is displayed in Itinerary
# Status: Active
# Labels: Flights,Galileo,GDS,Regression,Frequent flyer,Share Itinerary,FQTV,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-24T05:33:56Z
# Updated: 2025-10-27T12:57:48Z

@regression @galileo @flights @frequent_flyer @share_itinerary
Feature: 69254 Galileo - Frequent flyer number displayed in itinerary

  As a corporate traveler
  I want my frequent flyer number to appear in the shared itinerary
  So that loyalty information is included when sharing

  Scenario: Frequent flyer number is visible in shared itinerary
    Given I am logged in as "bsgalileoflight" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LIS" to "ATH"
    And I wait for flight results to be available
    And I filter airline results by "Aegean Airlines" checkbox
    And I add the first flight to cart
    # TODO: Adding_Frequent_Flyer — expand FF section, add/verify FF number
    # TODO: Click_on_share_itinerary_from_cart — click share itinerary button
    And I click the share itinerary button
    # TODO: Frequent_Flyer_is_displayed_in_Itinerary — verify FF number appears in share preview
