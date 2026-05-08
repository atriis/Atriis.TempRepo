@transportation @cars @regression
Feature: 57199 - Remove Direct Bill to Pay by CC

  Scenario: Verify direct bill option is removed and payment is by credit card
    Given I am logged in
    When I configure payment settings
    Then the direct bill option should be removed
    And payment should be processed by credit card only
