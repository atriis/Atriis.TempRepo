@transportation @cars @regression
Feature: 64409 - In Progress Page Confirmation

  Scenario: Verify in progress page confirmation flow
    Given I am in the booking process
    When I reach the in progress page
    Then the in progress confirmation should be displayed
    And the status should show "In Progress"
    When I confirm the action
    Then the booking should transition to confirmed state
    And success message should be displayed
