@transportation @cars @regression
Feature: 59287 - Cars - No Alert When Payment Mandatory

  Scenario: Verify no alert is displayed when payment is mandatory during car booking
    Given I am logged in
    When I search for cars with mandatory payment
    And I proceed to checkout
    Then no alert should be displayed about payment being optional
