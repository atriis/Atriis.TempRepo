@transportation @cars @regression @provider:amadeus
Feature: 73482 Amadeus - Verify Terms/Fare Rules Are Loading in Results, Cart and Checkout

  Scenario: Verify terms and fare rules are displayed in results, cart, and checkout pages for Amadeus cars
    Given I am logged in as "testim@nobillback"
    When I book a new trip
    And I add myself as a traveler
    And I search for a car at "Paris, (CDG) France"
    Then the fare rules should be visible on the first car in results
    When I add the first car to cart
    Then the fare rules should be displayed in the cart
    When I accept all Terms & Conditions on the page
    And I proceed to checkout
    Then the fare rules should be displayed in checkout
    When I complete the booking
    Then the trip should be successfully completed
