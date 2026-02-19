@daily_cars @provider:amadeus
Feature: 59775 Cars - Different drop off and pick up - Location is updated correctly after edit search
  As a corporate traveler using Amadeus
  I want to search for a car with different pickup and dropoff locations
  So that I can verify the locations are correctly displayed and updated

  @priority:high
  Scenario: Search car with different pickup and dropoff locations
    Given I am logged in as "amadeus" "user_one" and ready to book a new trip
    And I have added myself as the traveler
    When I search for a car from "Hamburg,Hamburg,Germany,(HAM)" to "Berlin,Germany,(BER)"
    Then the car location at city center index 0 should contain "HAMBURG"
    When I edit the car search from "San Diego,CA,USA,(SAN)" to "New York,NY,USA,(NYC)"
    Then the car location at city center index 0 should contain "SAN DIEGO"
    Then the search title should contain "San Diego"

