@transportation @cars @regression @provider:sunny
Feature: 66119 - Sunny Cars - Expired Quote Not Displayed in Checkout

  Scenario: Verify expired quote is not displayed in checkout summary
    Given I am logged in with a Sunny Cars account
    When I search for cars
    And the quote expires
    And I proceed to checkout
    Then the expired quote should not be displayed in the summary
