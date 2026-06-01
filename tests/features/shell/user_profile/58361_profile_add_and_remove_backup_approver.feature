# Test Name: 58361 Profile - User can add and remove backup approver
# Description:
# Status: Active
# Labels: Regression,Profile,backup approver,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-14T12:06:41Z
# Updated: 2025-09-17T11:53:10Z

@regression @profile @backup-approver
Feature: 58361 Profile - Add and remove backup approver
  As a corporate traveler
  I want to add and remove a backup approver in my profile
  So that another person can approve my travel requests when I am unavailable

  @priority:medium
  Scenario: Add a backup approver and then remove it
    Given I am logged in as "hayley@backupapprover.com"
    When I navigate to my user profile
    And I add a backup approver by searching "rui"
    Then the backup approver field should show a name containing "RUI"
    When I save the personal details
    Then I should see a success notification
    When I remove the backup approver
    And I save the personal details
    Then I should see a success notification
    And the backup approver field should show "Select"
