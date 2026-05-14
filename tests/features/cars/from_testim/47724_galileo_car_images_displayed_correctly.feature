@transportation @cars @regression @provider:galileo
Feature: 47724 Galileo Car Images Displayed Correctly in Results Page

  Scenario: Verify car images are displayed in search results
    Given I am logged in as "beatrizpamplonacorp"
    When I book a new trip
    And I add myself as a traveler
    And I search for a car at "Zurich, (ZRH) Switzerland"
    Then the first car in results should have an image
    And I should see the "Add to trip" button on the first car
