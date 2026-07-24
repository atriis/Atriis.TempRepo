# Test Name: 40136 [Merge] Corp admin - Corporate user can't delete role and an error message is displayed and can edit Per Diem
# Description:
# Status: Active
# Labels: Administration,merge,PerDiem,Role,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-04-07T07:54:11Z
# Updated: 2025-09-29T03:20:53Z
#
# AngularJS Administration UI (admin panel), not the OBT/Vue app.
# NOTE: steps marked "# TODO (new step):" are NOT implemented yet — the TODO
# describes what the step should do. Step defs / DSL / pages are intentionally
# NOT created here; implement later via @todo-pipeline.

@regression @shell @administration @roles @per_diem
Feature: 40136 - Corporate admin cannot delete a role and can edit Per Diem
  As a corporate administrator
  I want to confirm a newly created role cannot be deleted and that Per Diem settings can be edited and saved
  So that role deletion is blocked with an error message and Per Diem destinations can be managed

  Scenario: Corp admin adds a role that cannot be deleted, then edits and saves Per Diem settings
    # Part A - Add a new role and verify it cannot be deleted
    Given I am logged in as "testim@prof.com"
    When I navigate to the administration page
    # TODO (new step): open the Roles admin section — click "[title='Roles']" and wait for the roles datatable header (".datatable-header tr > :nth-child(1)" == "Role").
    And I open the Roles section in the administration
    # TODO (new step): start a new role — click "[data-ng-click='onAddNewRoleClicked()'] span".
    And I click add new role in the administration
    # TODO (new step): random-value-generator (manual in Testim) — generate a unique role name, STORE it on the world for later reuse, and type it into "[data-ng-model='role.Name']".
    And I enter a random role name in the administration
    # TODO (new step): select all privileges — click the select-all checkbox (".role-edit-container [ng-checked='model.selectAllUnSelected']") then move-to-selected (".role-edit-container [data-ng-click='addItemToList(unselectedItems, selectedItems,true)']").
    And I select all privileges for the role in the administration
    # TODO (new step): add a user to the role — type {string} into the users filter ("[is-edit-users='isEditUsers'] .ng-dirty"), click its select-all checkbox, then move-to-selected ("[is-edit-users='isEditUsers'] [data-ng-click='addItemToList(...,true)']").
    And I add the user "Hudgens vanessa" to the role in the administration
    # TODO (new step): save the role — scroll to and click "[data-ng-click='onSaveClicked()']".
    And I save the role in the administration
    Then the "Save succeeded" confirmation toast should be displayed in the administration
    # TODO (new step): search for the created role — type the STORED random role name into "[placeholder='Search role name or privileges']".
    When I search for the created role in the administration
    # TODO (new step): assert the created role is listed (source "// TODO Please add an assertion here") — "[data-ng-repeat='role in roles | filter:roleSearchText'] > :nth-child(1) .ng-binding" equals the stored random role name.
    Then the created role should be listed in the administration
    # TODO (new step): assert the delete button is present — ".button-secondary" is visible.
    And the delete role button should be visible in the administration
    # TODO (new step): click delete — click ".button-secondary".
    When I click the delete role button in the administration
    # TODO (new step): assert the delete confirmation dialog — "#ui-id-2" reads "Delete Role".
    Then the delete role dialog should be displayed in the administration
    # TODO (new step): confirm deletion — click the primary dialog button ".ui-dialog-buttonset > :nth-child(1)".
    When I confirm the role deletion in the administration
    # Expect deletion to be blocked: a "Save failed" toast is shown (role cannot be deleted).
    Then the "Save failed" confirmation toast should be displayed in the administration

    # Part B - Edit and save Per Diem settings
    # TODO (new step): open the Per Diem Settings admin section — click "[title='Per Diem Settings']".
    When I open the Per Diem Settings section in the administration
    # TODO (new step): open a specific per diem by name — click "[title='<{string}>']" (e.g. the fixture "testim - specific test - do not touch it").
    And I open the "testim - specific test - do not touch it" per diem in the administration
    # TODO (new step): assert the per diem detail opened — ".selected-details-container > :nth-child(1) .admin-field-group-header" reads "General information".
    Then the per diem general information should be displayed in the administration
    # TODO (new step): add a destination row — click "[ng-click='onNewDestinationClicked()'] a".
    When I add a new destination to the per diem in the administration
    # TODO (new step): pick the first destination — open the select2 ("#s2id_autogen129 b") and click the first result (".select2-results > li:nth-of-type(1) .select2-result-label").
    And I select the first destination in the per diem in the administration
    # TODO (new step): set the daily sum — type {string} into "[data-ng-model='destination.DailySum']".
    And I set the per diem daily sum to "10" in the administration
    # TODO (new step): pick the first currency — open the select2 ("#s2id_autogen131 b") and click the first result ("#select2-drop .select2-results > li:nth-of-type(1) .select2-result-label").
    And I select the first per diem currency in the administration
    # TODO (new step): save the per diem — click ".button-primary". Reused for both saves in Part B.
    And I save the per diem in the administration
    Then the "Save succeeded" confirmation toast should be displayed in the administration
    # TODO (new step): remove the destination — click "[ng-click='onRemoveDestenation($index)']".
    When I remove the destination from the per diem in the administration
    And I save the per diem in the administration
    Then the "Save succeeded" confirmation toast should be displayed in the administration
    # TODO: negative-element-validation (manual in Testim source)
    # TODO (new step): NEGATIVE assertion — verify the removed destination row is no longer listed in the per diem destinations table. Needs an explicit "element absent" check.
    And the destination should no longer be listed in the per diem in the administration
