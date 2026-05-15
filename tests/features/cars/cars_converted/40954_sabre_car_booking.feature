@transportation @cars @regression @provider:sabre
Feature: 40954 - Sabre Car Booking

  Scenario: User can successfully complete a Sabre car booking
    Given I am logged in with a Sabre car account
    When I book a new trip
    And I add myself as the traveler
    And I search for cars
    And I select a car from the results
    Then I can complete the booking successfully
