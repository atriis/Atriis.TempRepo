# Test Name: 40136 [Merge] Corp admin - Corporate user can't delete role and an error message is displayed and can edit Per Diem
# Description:
# Status: Active
# Labels: Administration,merge,PerDiem,Role,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-04-07T07:54:11Z
# Updated: 2025-09-29T03:20:53Z
#
# AngularJS Administration UI (admin panel), not the OBT/Vue app.

@regression @shell @administration @roles @per_diem
Feature: 40136 - Corporate admin cannot delete a role and can edit Per Diem
  As a corporate administrator
  I want to confirm a newly created role cannot be deleted and that Per Diem settings can be edited and saved
  So that role deletion is blocked with an error message and Per Diem destinations can be managed

  Scenario: Corp admin adds a role that cannot be deleted, then edits and saves Per Diem settings
    # Part A - Add a new role and verify it cannot be deleted
    Given I am logged in as "testim@prof.com"
    When I navigate to the administration page
    And I open the Roles section in the administration
    And I click add new role in the administration
    And I enter a random role name in the administration
    And I select all privileges for the role in the administration
    And I add the user "Hudgens vanessa" to the role in the administration
    And I save the role in the administration
    Then the "Save succeeded" confirmation toast should be displayed in the administration
    When I search for the created role in the administration
    Then the created role should be listed in the administration
    And the delete role button should be visible in the administration
    When I click the delete role button in the administration
    Then the delete role dialog should be displayed in the administration
    When I confirm the role deletion in the administration
    # Expect deletion to be blocked: a "Save failed" toast is shown (role cannot be deleted).
    Then the "Save failed" confirmation toast should be displayed in the administration

    # Part B - Edit and save Per Diem settings
    When I open the Per Diem Settings section in the administration
    And I open the "testim - specific test - do not touch it" per diem in the administration
    Then the per diem general information should be displayed in the administration
    When I add a new destination to the per diem in the administration
    And I select the first destination in the per diem in the administration
    And I set the per diem daily sum to "10" in the administration
    And I select the first per diem currency in the administration
    And I save the per diem in the administration
    Then the "Save succeeded" confirmation toast should be displayed in the administration
    When I remove the destination from the per diem in the administration
    And I save the per diem in the administration
    Then the "Save succeeded" confirmation toast should be displayed in the administration
    And the destination should no longer be listed in the per diem in the administration
