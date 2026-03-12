@daily_flights @provider:amadeus
Feature: 53410 Amadeus - Flight - Search by schedule - Multipax - "My Selection" has the correct price in pricing page and cart
  As a corporate traveler
  I want to add flights to my cart
  So that I can review them before booking

  @priority:critical
  Scenario: Add flight by schedule to cart
    Given I am logged in as "ruimendes" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Rui Marista"
    When I search for a flight by schedule from "LIS" to "MAD"
    And I filter results by carrier "TAP"
    And I click on "Pricing Options" for the first result
    And I extract the price from first pricing option
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for the change flight button to be visible
    And I filter results by carrier "Iberia"
    And I click on "Pricing Options" for the first result
    And I extract the price from first pricing option
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for "Your Selection" text to be visible
    And I extract the price at index 0 from "Your Selection"
    And I add "Your Selection" fare to trip
    And I extract the price at index 0 from "cart"
    Then the sum of extracted prices at index 0 "TAP pricing option" and 1 "Iberia pricing option" should equal the extracted price at index 2 "Your Selection"
    And the price at index 0 from "Your Selection" should equal the price at index 0 from "cart"