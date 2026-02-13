@share-flight @pricing-options
Feature: Share flight from pricing options
  As a corporate traveler
  I want to share flight offers selected from pricing options
  So the price in the shared offer matches the prices selected from pricing options

  @share-flight
  Scenario Outline: User shares price offers selected from pricing options
    Given I am logged in as "<provider>" "<user>" and ready to book a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "MAD" to "LIS"
    When I click on the "Share" button
    And I filter results by carrier "TAP"
    And I click on "Pricing Options" for the first result
    And I extract the price from first pricing option
    And I "Select to share" first option from pricing options
    And I click share from pricing options
    And I filter results by carrier "Iberia"
    And I click on "Pricing Options" for the first result
    And I extract the price from first pricing option
    And I "Select to share" first option from pricing options
    And I click share from pricing options
    When I click on the "Share" button to open the share dialog
    And I scroll into offers and get prices
    Then The shared price for carrier "TAP" should match the price from pricing options
    And The shared price for carrier "Iberia" should match the price from pricing options

    Examples:
      | provider | user     |
      | amadeus  | user_one |
      | galileo  | user_one |
