@transportation @cars @regression @provider:sabre
Feature: 55167 - Sabre car - Edit loyalty number after checkout

  Scenario: User can edit and add loyalty number after completing car booking
    Given I am logged in as "berry@loyal" booking a new trip
    And I add myself as a traveler
    When I search for a car at "LHR"
    And I add the first car from results to cart
    And I wait for the trip to show as "Pending booking"
    And I accept Terms & Conditions
    And I proceed to checkout
    And I complete the booking
    Then the trip should show as "Confirmed"
    When I expand the car section in trip overview
    And I open the car details editor
    And I edit the car loyalty number to "565656"
    And I save the loyalty number changes
    Then the car loyalty number should be saved as "565656"
