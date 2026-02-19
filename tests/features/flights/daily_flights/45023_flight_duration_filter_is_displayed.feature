@daily_flights @provider:amadeus
Feature: 45023 Flight Duration - Flight Duration filter is displayed
  As a corporate traveler
  I want to search for a round trip flight
  So that I can see the Flight Duration filter displayed in results

  @priority:critical
  Scenario: Flight Duration filter is displayed in search results
    Given I am logged in as "amadeus" "user_one" and ready to book a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    Then flight results should be displayed
    When I scroll to the Flight Duration filter
    Then the Flight Duration filter should be visible
    When I scroll to the Flight Duration filter for "Depart from London"
    Then the Flight Duration filter for "Depart from London" should be visible
    When I scroll to the Flight Duration filter for "Depart from Madrid"
    Then the Flight Duration filter for "Depart from Madrid" should be visible