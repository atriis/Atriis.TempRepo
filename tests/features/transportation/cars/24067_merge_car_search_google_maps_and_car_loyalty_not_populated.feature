# Test Name: 24067 MERGE - Car search - Google maps and Car loyalty not populated
# Description:
# Status: Active
# Labels: Cars,Google Maps,No Amadeus Hotel Book,Regression,Amadeus,Transportation,2026 plan 1
# Owner: Noam Miller
# Created: 2024-01-02T12:05:18Z
# Updated: 2025-07-25T10:52:27Z

@transportation @cars @provider:amadeus @regression
Feature: 24067 Amadeus - Car search Google Maps and loyalty not populated
  As a corporate traveler
  I want to verify car search and location map behavior
  So that I can confirm cart data is consistent

  Scenario: Search car, validate Google Maps link, and verify loyalty is not prepopulated
    Given I am logged in as "ampmaccars" booking a new trip
    And I have added a random guest traveler
    When I search for a car in "London, UK"
    And I select the first city center pickup location
    And I wait for add to trip text to be visible
    And I open the first car location link in results
    Then I should see the selected car location in Google Maps
    When I add the first car to cart
    Then the car loyalty should not be prepopulated

    # TODO: Verify login mapping for testim@amadeus.com. Used label "ampmaccars" from .env value testim@amadeus.am as nearest existing account.
