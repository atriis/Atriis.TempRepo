@transportation @cars @regression @provider:sabre
Feature: 58984 - Sabre Car - Multiple Car Bookings Share PNR

  Scenario: Verify that when booking two Sabre cars they share the same PNR
    Given I am logged in with a Sabre account
    When I book a first car
    And I book a second car
    Then both cars should be associated with the same PNR
    And the booking should be complete
