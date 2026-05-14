@transportation @cars @regression @provider:amadeus
Feature: 73142 Amadeus - Cars - Pay on Departure and Prepaid Payment Methods

  Scenario: Verify pay on departure payment method is displayed for Amadeus cars
    Given I am logged in as "testim@nobillback"
    When I book a new trip
    And I add myself as a traveler
    And I search for a car at "Barcelona, (BCN) Spain"
    Then the first car should display payment method "Pay On Departure"
    When I add the first car to cart
    Then the cart should show payment method "Pay On Departure"
    When I accept all Terms & Conditions on the page
    And I proceed to checkout
    And I complete the booking
    Then the booking confirmation should display payment method "Pay On Departure"

  Scenario: Verify second search returns correct payment method for Amadeus cars
    Given I am logged in as "testim@nobillback"
    When I book a new trip
    And I add myself as a traveler
    And I search for a car at "Amsterdam, (AMS) Netherlands"
    Then the first car should display a payment method
    When I add the first car to cart
    And I accept all Terms & Conditions on the page
    And I proceed to checkout
    And I complete the booking
    Then the trip should be successfully completed
