@transportation @cars @regression @provider:galileo
Feature: 47724 HYBRID Galileo Car Images Displayed Correctly in Results Page

  Scenario: Verify car images are displayed in search results
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added myself as the traveler
    And I search for a car at "Zurich, (ZRH) Switzerland"
    And I wait for add to trip text to be visible
