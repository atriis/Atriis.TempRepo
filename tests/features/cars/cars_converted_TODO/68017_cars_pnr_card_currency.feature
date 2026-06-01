@transportation @cars @regression
Feature: 68017 - Cars PNR Remark Card Display Currency

  Scenario: Verify PNR remark displays card and currency information correctly
    Given I am logged in
    When I book a car
    And I proceed to checkout
    Then the PNR remark should display the card information used
    And the currency should be displayed correctly
