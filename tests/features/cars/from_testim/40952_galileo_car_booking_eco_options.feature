@transportation @cars @regression @provider:galileo
Feature: 40952 - Galileo Car Booking with Travel Policy and Eco Options

  Scenario: User can book a Galileo car with travel policy and eco car options
    Given I am logged in with a Galileo account
    When I book a new trip
    And I add a traveler
    And I search for cars with eco options
    Then travel policy should be applied
    And eco car options should be available
    When I select an eco car
    And I complete the booking
    Then the booking should be successful
