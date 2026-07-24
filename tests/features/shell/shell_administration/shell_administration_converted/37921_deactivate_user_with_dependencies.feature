# Test Name: 37921 MERGED can see all dependencies when deactivating user with dependencies + can deactivate user with dependency
# Description:
# Status: Active
# Labels: Administration,Regression,Deactivate,Users,Daily Shell,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-04-08T09:51:02Z
# Updated: 2025-09-05T01:34:51Z
#
# Source: tests/testim/active/regression_set_new_front/shell/administration/
#   37921_merged_can_see_all_dependencies_when_deactivating_user_with_dependencies+can_deactivate_user_with_dependency.js
# AngularJS Administration UI (admin panel), not the OBT/Vue app.
# NOTE: steps marked "# TODO (new step):" are NOT implemented yet — the TODO
# describes what the step should do. Step defs / DSL / pages are intentionally
# NOT created here; implement later via @todo-pipeline.

@regression @shell @administration @deactivate @users
Feature: 37921 - See all dependencies when deactivating a user and deactivate a user with a dependency
  As an administrator
  I want to see every dependency a user has before deactivating them
  So that I understand the impact and can safely deactivate a user that has dependencies

  Scenario: See all dependencies when deactivating users with dependencies and deactivate a user with a dependency
    Given I am logged in as "Avi@Avrahami.com"
    When I navigate to the administration page
    # TODO (new step): open the Users admin section — click "[title='Users']" and wait for the users datatable header to render.
    And I open the Users tab in the administration
    # TODO (new step): assert a users-table column header — ".datatable-header tr > th:nth-of-type(2) span" equals {string} (e.g. "First Name").
    Then the administration users table should display the "First Name" column header

    # Part A - deactivate "penni dep", a user that has a single dependency
    # TODO (new step): filter the users list — type {string} into the search box ("[ng-disabled='isDisabled']"). Distinct from "search for user … in the administration": this only filters, it does NOT open the record.
    When I filter the administration users by "Penni dep"
    # TODO (new step): assert the first filtered result — first row name cell ("[data-ng-repeat='user in users …'] > td:nth-of-type(2) .ng-binding") contains {string} (case-insensitive).
    Then the administration user results should contain "penni"
    # TODO (new step): select the first result — click its row checkbox "[ng-model='user.IsChecked']".
    When I select the first user in the administration results
    # TODO (new step): open the deactivate popup — click "[data-ng-click='openDeactivateUserPopup(selectedUsers)'] span".
    And I click the deactivate user button in the administration
    # TODO (new step): assert popup body text — a text node inside the dependencies popup ("[ng-show='dependantUsers.length == 1'] td …") equals {string}. Reused for each expected sentence.
    Then the deactivation dependencies popup should state "The user 'penni dep' is associated with the following dependencies:"
    # TODO (new step): assert a listed dependency — a dependency <li> in the popup ("[ng-show='dep.DependencyName == …']") equals/contains {string}. Reused for every dependency line below.
    And the deactivation dependencies popup should list the dependency "Daphna Depen - Approval Flow Approver"
    And the deactivation dependencies popup should state "If you proceed with the deactivation process, he will no longer be part of these dependencies. Are you sure you would like to proceed?"
    # TODO (new step): confirm deactivation — click "[ng-click='onSaveClicked()']" in the popup.
    When I confirm the user deactivation in the popup
    # TODO: negative-element-validation - the Testim source noted this validation "has to be done manually at this time"
    # TODO (new step): NEGATIVE assertion (currently manual) — after deactivation, verify the user is no longer present as an active dependency. Needs a proper "element absent / not listed" assertion; flagged manual in the Testim source, so implement as an explicit absence check.
    Then I manually verify the deactivated user is no longer listed as a dependency
    # TODO (new step): toggle inactive users into view — click "[data-ng-model='showInactive']".
    When I show inactive users in the administration
    # TODO (new step): assert the user status badge — ".user-scroll-corporate [ng-hide='user.DeletionDate && user.DeletionDate!=null']" equals {string} ("Inactive" / "Active").
    Then the administration user status should be "Inactive"

    # Confirm the deactivated user still appears as a dependency in the approver's record
    When I clear the user search in the administration
    And I search for user "Daphna" in the administration
    # TODO (new step): assert an approval-flow dependency value — scroll to the approval-flow section and verify "[class$='choices'] .ng-binding" equals {string} (the deactivated user still listed on the approver's record).
    Then the approval flow dependency should display "penni dep (deactivatewith@dependency.com)"

    # Part B - view all dependencies of "Nancy lotof" and validate a dependency link
    When I clear the user search in the administration
    And I filter the administration users by "Nancy lotof"
    Then the administration user results should contain "Nancy"
    When I select the first user in the administration results
    And I click the deactivate user button in the administration
    Then the deactivation dependencies popup should state "The user 'Nancy Lotof' is associated with the following dependencies:"
    And the deactivation dependencies popup should list the dependency "TESTIM mandatory field - Travel Manager"
    And the deactivation dependencies popup should list the dependency "dependency - Approval For Changes Approver"
    And the deactivation dependencies popup should list the dependency "amadeus - Booker, Approval Flow Approver"
    And the deactivation dependencies popup should list the dependency "Mendy Tori - Backup Approver"
    And the deactivation dependencies popup should list the dependency "Lior Yahalomi - Approval Flow Approver, Out of Office Replacement"
    And the deactivation dependencies popup should list the dependency "Avi Avrahami - Approval Flow Approver, Approval For Changes Approver"
    # NOTE: "specific approver1"/"specific approver2" are substring/regex matches in the source — the step should match the dependency text as a contains, not an exact equality.
    And the deactivation dependencies popup should list the dependency "specific approver1"
    And the deactivation dependencies popup should list the dependency "specific approver2"
    And the deactivation dependencies popup should list the dependency "bz-w-kiev - Financial Reference Approver"
    And the deactivation dependencies popup should state "If you proceed with the deactivation process, he will no longer be part of these dependencies. Are you sure you would like to proceed?"
    # TODO (new step): open the first dependency link — click the first popup <li>'s "[target='_blank']" anchor (opens the linked entity).
    When I open the first dependency link in the deactivation popup
    # TODO (new step): assert the linked entity page — the name field "[name='Name']" equals {string}.
    Then the linked dependency page should display the name "TESTIM mandatory field"
    # TODO (new step): close the dependencies popup — click "#popUpCloseBtn > div".
    When I close the deactivation dependencies popup

    # Tail - reactivate "penni dep" so the test is repeatable on the next run
    When I clear the user search in the administration
    And I filter the administration users by "Penni dep"
    Then the administration user results should contain "penni"
    And the administration user status should be "Inactive"
    When I select the first user in the administration results
    # TODO (new step): reactivate the selected user — click "[data-ng-click='onActivateOrDeactivateClicked(true)'] span"; leaves the fixture user Active for the next run.
    And I activate the first user in the administration
    Then the administration user status should be "Active"
