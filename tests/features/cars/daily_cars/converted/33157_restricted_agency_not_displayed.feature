# Test Name: 33157 restricted car rental agency should not appear in the results
# Labels: Regression, Cars, restriction
# Owner: Bruna Santos
# Created: 2025-03-13T08:19:03Z
# Updated: 2025-03-13T08:37:35Z

@transportation @cars @regression @provider:amadeus
Feature: 33157 - Restricted Car Rental Agency Should Not Appear in Results

  Scenario: Verify restricted rental agencies do not appear in search results
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "Hato Intl. (CUR),Willemstad, Netherlands Antilles" with rental agency "Thrifty" no results should be returned

