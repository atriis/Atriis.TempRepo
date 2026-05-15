@transportation @cars @regression
Feature: 56625 - Car Bill Back Allow Checkbox FOP

  Scenario: Verify car bill back allow checkbox in form of payment setup
    Given I am logged in
    When I configure form of payment settings
    Then the bill back allow checkbox for cars should be available
    And the checkbox should function correctly
