@transportation @cars @regression @amadeus
Feature: Amadeus - All-inclusive rate link is not displayed for Amadeus supplier

  Scenario: Verify all-inclusive rate link is not displayed in car results
    Given I am logged in as "brunasantosnl"
    And I book a new trip
    And I add myself as the traveler
    And I select Budget rental agency
    When I search for a car at "LHR"
    And I click proceed after search and dismiss any warnings
    And I wait for "Add to trip" text to appear on car results
    And I filter results by "Compact"
    And I add the first car to cart
    And I wait for pending booking
    Then the "All-inclusive rate" link is not displayed in the results
