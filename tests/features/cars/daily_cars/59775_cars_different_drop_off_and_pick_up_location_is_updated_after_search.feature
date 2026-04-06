@daily_cars @provider:amadeus
Feature: 59775 Cars - Different drop off and pick up - Location is updated correctly after edit search
  As a corporate traveler using Amadeus
  I want to search for a car with different pickup and dropoff locations
  So that I can verify the locations are correctly displayed and updated

  @priority:high
  Scenario: Search car with different pickup and dropoff locations
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a car from "Hamburg,Hamburg,Germany,(HAM)" to "Berlin,Germany,(BER)" with 1 months ahead
    Then the car location at city center index 0 should contain "HAMBURG"
    When I edit the car search from "San Diego,CA,USA,(SAN)" to "New York,NY,USA,(NYC)" with 2 months ahead
    Then the car location at city center index 0 should contain "SAN DIEGO"
    Then the search title should contain "San Diego"

