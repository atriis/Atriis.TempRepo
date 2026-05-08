@transportation @cars @regression @provider:galileo
Feature: 47723 - Galileo Car - Filter by Class and Complete Booking

  Scenario: User can filter cars by class SUV/Pickup/Van and complete booking for pickup
    Given I am logged in with a Galileo account
    When I search for cars
    And I filter results by car class "SUV/Pickup/Van"
    Then only cars in that class should be displayed
    When I select a car and complete the booking for pickup
    Then the booking should be successful
