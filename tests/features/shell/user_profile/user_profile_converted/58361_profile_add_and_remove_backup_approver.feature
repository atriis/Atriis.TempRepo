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
    # TODO: Step needs implementation — click dropdown arrow, type "testim", select first match
    # DSL candidate: Profile.addBackupApprover(page, searchTerm)
    And I add a backup approver by searching "testim"
    # TODO: Step needs implementation — assert placeholder/selected text contains "TESTIM"
    # DSL candidate: Profile.verifyBackupApproverContains(page, text)
    Then the backup approver field should show a name containing "TESTIM"
    # TODO: Step needs implementation — click save button
    # DSL candidate: Profile.saveProfileChanges(page)
    When I save the profile changes
    Then I should see a success notification
    # TODO: Step needs implementation — hover dropdown, click clear icon
    # DSL candidate: Profile.removeBackupApprover(page)
    When I remove the backup approver
    And I save the profile changes
    Then I should see a success notification
    # TODO: Step needs implementation — assert placeholder text is "Select"
    # DSL candidate: Profile.verifyBackupApproverPlaceholder(page, text)
    And the backup approver field should show "Select"
