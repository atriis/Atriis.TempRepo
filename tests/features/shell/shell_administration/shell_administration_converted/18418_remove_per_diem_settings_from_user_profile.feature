# Test Name: 18418 we should be able to remove per diem settings from user profile
# Description:
# Status: Active
# Labels: Regression,PerDiem,Administration,Daily Shell,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-03-13T07:53:36Z
# Updated: 2026-01-01T06:43:02Z
#
# AngularJS Administration UI (admin panel), not the OBT/Vue app.
# NOTE: the steps below marked "# TODO (new step):" are NOT implemented yet.
# Each TODO describes what the new step should do; step defs / DSL / pages
# are intentionally NOT created here — implement later via @todo-pipeline.

@regression @shell @administration @per_diem
Feature: 18418 - Remove per diem settings from user profile
  As an administrator
  I want to remove a user-level per diem setting from a user profile
  So that the user reverts to inheriting the per diem for the user group

  Scenario: Administrator removes the per diem setting from a user profile
    Given I am logged in as "testim@add.com"
    When I navigate to the administration page
    # TODO (new step): open the Users admin section — click the "[title='Users']" nav item and wait for the "Add New User" button ("[data-ng-click='onAddNewUserClicked()'] span") to be visible.
    And I open the Users tab in the administration
    # TODO (new step): assert the users list rendered — the "Add New User" button / users datatable (".body-container tbody") is visible.
    Then the administration users list should be displayed
    # TODO (new step): open the first user record — click the first row's name cell (".body-container tbody > :nth-child(1) > :nth-child(2)"); wait for the detail form.
    When I open the first user in the administration users list
    # TODO (new step): assert the user detail form is shown — "[user='selectedUser'] > :nth-child(1) > :nth-child(1) label" reads "First Name:".
    Then the user detail form should be displayed in the administration
    # TODO (new step): scroll to and assert the Per Diem section header — "[on='settings.isDisplayCorporatePerdiemIdInherited'] label" reads "Per Diem".
    And the Per Diem section should be displayed in the administration
    # TODO: precondition — ensure a user-level per diem is configured before removing it (k() helper)
    # TODO (new step): configure a user-level per diem — if the "inherited" toggle is on, click "[data-ng-click='settings.isDisplayCorporatePerdiemIdInherited=false']", open the select2 ("#s2id_autogen91 arrow"), pick the option matching {string}, and confirm the chosen text equals {string}.
    When I set the per diem setting to "per diem for user" for the administration user
    # TODO (new step): assert the selected user-level per diem — the select2 chosen span ("#s2id_autogen91 ... .select2-chosen") equals {string}.
    Then the per diem setting should show "per diem for user"
    # TODO (new step): remove the user-level per diem — click "[data-ng-show='!settings.isDisplayCorporatePerdiemIdInherited']" so the user reverts to inheriting the group per diem.
    When I remove the per diem setting from the user profile
    And I save the administration user
    Then the "Save succeeded" confirmation toast should be displayed in the administration
    # TODO: dropped scroll-to-top chrome noise (scrollTo 0,0) — non-business action
    # TODO (new step): reopen a user by name — scroll list to top, find the row whose 5th cell (".body-container tbody ... :nth-child(5)") equals {string}, click it, wait for the detail form ("First Name:").
    When I reopen the user "TESTIM" from the administration users list
    Then the user detail form should be displayed in the administration
    And the Per Diem section should be displayed in the administration
    # TODO (new step): assert the inherited per diem hint — "[data-ng-hide='!settings.isDisplayCorporatePerdiemIdInherited']" reads {string} (e.g. "per diem for user group"), confirming removal reverted to group inheritance.
    And the per diem setting should show "per diem for user group"
    # TODO: restore/cleanup — re-configure the user-level per diem so the run is idempotent
    When I set the per diem setting to "per diem for user" for the administration user
    And I save the administration user
    Then the "Save succeeded" confirmation toast should be displayed in the administration
