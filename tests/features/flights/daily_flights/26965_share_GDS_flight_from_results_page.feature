@share-flight
Feature: Share flight price offer
  As a corporate traveler
  I want to share 2 price offers from results for different carriers for any GDS supplier
  So the price in results and in the share offer should be the same

  @share-flight
  Scenario Outline: User shares a price offer for selected flights
    Given I am logged in as "<provider>" "<user>" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "MAD" to "LIS"
    When I click on the "Share" button
    And I select 2 options from carriers "TAP" and "Iberia"
    And I click on the "Share" button to open the share dialog
    When I scroll into offers and get prices
    Then The shared price for carrier "TAP" should match the prices from results
    Then The shared price for carrier "Iberia" should match the prices from results

    Examples:
      | provider | user     |
      | amadeus  | user_one |
      | galileo  | user_one |