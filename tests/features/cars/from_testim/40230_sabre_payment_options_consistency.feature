@transportation @cars @regression @provider:sabre
Feature: 40230 - Sabre Cars - Prepaid or Pay on Departure Display

  Scenario: Verify prepaid or pay on departure payment options are consistent between search and cart
    Given I am logged in with a Sabre car provider account
    When I search for cars
    And the payment option is "prepaid"
    Then the cart should display the same "prepaid" payment option
    And the dates should match between search and cart
