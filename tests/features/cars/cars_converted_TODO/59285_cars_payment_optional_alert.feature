@transportation @cars @regression
Feature: 59285 - Cars - Add Alert When Payment Optional

  Scenario: Verify alert is added when payment is optional during car booking
    Given I am logged in
    When I search for cars with optional payment
    And I proceed to checkout
    Then an alert should be displayed indicating payment is optional
