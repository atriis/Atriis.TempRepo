@transportation @rails @evolvi @regression
Feature: 83489 Evolvi - Travel together
  As a corporate traveler
  I want to add multiple travelers in Evolvi search
  So discount banner is displayed in at least one of the fares

  Scenario: Travel together discount banner
    Given I am logged in as "corp@evolvi.com" booking a new trip
    When I select UK Rail in the search form
    And I have added myself as the traveler
    And I have added traveler by name "Beatriz Pamplona"
    And I have added traveler by name "Fabio Torres"
    When I search for a round trip Evolvi train from "nclToWok"
    And I acknowledge the push notification
    And I should see outbound text in Evolvi results page
    Then discount banner is displayed in at least one of the fares
    
