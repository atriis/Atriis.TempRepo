@transportation @cars @regression @provider:galileo
Feature: 55133 - Galileo - Dynamic fields sent as remark with traveler connection

  Scenario: Dynamic fields are filled and sent as remarks with traveler connection
    Given I am logged in as "rafael@dinmark" booking a new trip
    And I add myself as a traveler
    And I add a second traveler named "rafi din"
    When I search for a car at "LHR"
    And I click proceed after search
    And I add the first car from results to cart
    And I fill the mandatory dynamic fields in cart
    And I accept Terms & Conditions
    And I proceed to checkout
    Then the dynamic field values should be preserved with "7878" and "htht"
    When I complete the booking
    Then the trip should show as "Confirmed"
