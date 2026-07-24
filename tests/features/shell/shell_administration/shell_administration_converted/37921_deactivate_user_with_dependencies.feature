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

@regression @shell @administration @deactivate @users
Feature: 37921 - See all dependencies when deactivating a user and deactivate a user with a dependency
  As an administrator
  I want to see every dependency a user has before deactivating them
  So that I understand the impact and can safely deactivate a user that has dependencies

  Scenario: See all dependencies when deactivating users with dependencies and deactivate a user with a dependency
    Given I am logged in as "Avi@Avrahami.com"
    When I navigate to the administration page
    And I open the Users tab in the administration
    Then the administration users table should display the "First Name" column header

    # Part A - deactivate "penni dep", a user that has a single dependency
    When I filter the administration users by "Penni dep"
    Then the administration user results should contain "penni"
    When I select the first user in the administration results
    And I click the deactivate user button in the administration
    Then the deactivation dependencies popup should state "The user 'penni dep' is associated with the following dependencies:"
    And the deactivation dependencies popup should list the dependency "Daphna Depen - Approval Flow Approver"
    And the deactivation dependencies popup should state "If you proceed with the deactivation process, he will no longer be part of these dependencies. Are you sure you would like to proceed?"
    When I confirm the user deactivation in the popup
    # TODO: negative-element-validation - the Testim source noted this validation "has to be done manually at this time"
    Then I manually verify the deactivated user is no longer listed as a dependency
    When I show inactive users in the administration
    Then the administration user status should be "Inactive"

    # Confirm the deactivated user still appears as a dependency in the approver's record
    When I clear the user search in the administration
    And I search for user "Daphna" in the administration
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
    And the deactivation dependencies popup should list the dependency "specific approver1"
    And the deactivation dependencies popup should list the dependency "specific approver2"
    And the deactivation dependencies popup should list the dependency "bz-w-kiev - Financial Reference Approver"
    And the deactivation dependencies popup should state "If you proceed with the deactivation process, he will no longer be part of these dependencies. Are you sure you would like to proceed?"
    When I open the first dependency link in the deactivation popup
    Then the linked dependency page should display the name "TESTIM mandatory field"
    When I close the deactivation dependencies popup

    # Tail - reactivate "penni dep" so the test is repeatable on the next run
    When I clear the user search in the administration
    And I filter the administration users by "Penni dep"
    Then the administration user results should contain "penni"
    And the administration user status should be "Inactive"
    When I select the first user in the administration results
    And I activate the first user in the administration
    Then the administration user status should be "Active"
