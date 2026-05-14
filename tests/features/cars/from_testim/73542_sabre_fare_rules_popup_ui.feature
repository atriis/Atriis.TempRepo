@transportation @cars @regression @provider:sabre
Feature: 73542 Sabre - Fare Rules Popup UI - Vendor And Location Details Tab

  Scenario: Verify fare rules are displayed throughout the booking flow for Sabre cars
    Given I am logged in as "testim"
    When I book a new trip
    And I add myself as a traveler
    And I search for a car at "London, (LHR) United Kingdom"
    Then the fare rules should be visible on the first car in results
    When I add the first car to cart
    Then the fare rules should be displayed in the cart
    When I accept all Terms & Conditions on the page
    And I proceed to checkout
    And I complete the booking
    Then the trip should be successfully completed
