# ADO Work Item: 66941
# [Cars] Rental Counter Location Filter
# Verifies that the Rental Counter Location filter is visible in car search results,
# has the correct options, and correctly filters and restores results when applied/removed.

@transportation @cars @regression @daily_cars @provider:amadeus @priority:high @ado:66941
Feature: 66941 Cars - Rental Counter Location Filter
  As a corporate traveler using Amadeus
  I want to filter car search results by rental counter location
  So that I can find cars available at my preferred pickup location type

  Scenario: Rental Counter Location filter is visible, functional, and restores results on deselect
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "barajas" with 1 months ahead
    When I wait for add to trip text to be visible
    Then the "Rental Counter Location" filter should be visible in car results
    Then the "Rental Counter Location" filter options should only contain valid counter location values
    When I select the "At airport" option in the "Rental Counter Location" filter
    Then the car location label at index 0 should contain "Airport - In Terminal" on results
    When I deselect the "At airport" option in the "Rental Counter Location" filter
    Then all car results should be restored
    When I select the "Shuttle required" option in the "Rental Counter Location" filter
    Then the car location label at index 0 should contain "Airport - Shuttle required" on results
    When I deselect the "Shuttle required" option in the "Rental Counter Location" filter
    Then all car results should be restored
