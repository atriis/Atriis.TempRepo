# Test Name: 18418 we should be able to remove per diem settings from user profile
# Description:
# Status: Active
# Labels: Regression,PerDiem,Administration,Daily Shell,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-03-13T07:53:36Z
# Updated: 2026-01-01T06:43:02Z

@regression @shell @administration @per_diem 
Feature: 18418 - Remove per diem settings from user profile
  As an administrator
  I want to remove a user-level per diem setting from a user profile
  So that the user reverts to inheriting the per diem for the user group

  Scenario: Administrator removes the per diem setting from a user profile
    Given I am logged in as "testim@add.com"
    When I navigate to the administration page
    And I open the Users tab in the administration
    Then the administration users list should be displayed
    When I open the first user in the administration users list
    Then the user detail form should be displayed in the administration
    And the Per Diem section should be displayed in the administration
    # TODO: precondition — ensure a user-level per diem is configured before removing it (k() helper)
    When I set the per diem setting to "per diem for user" for the administration user
    Then the per diem setting should show "per diem for user"
    When I remove the per diem setting from the user profile
    And I save the administration user
    Then the "Save succeeded" confirmation toast should be displayed in the administration
    # TODO: dropped scroll-to-top chrome noise (scrollTo 0,0) — non-business action
    When I reopen the user "TESTIM" from the administration users list
    Then the user detail form should be displayed in the administration
    And the Per Diem section should be displayed in the administration
    And the per diem setting should show "per diem for user group"
    # TODO: restore/cleanup — re-configure the user-level per diem so the run is idempotent
    When I set the per diem setting to "per diem for user" for the administration user
    And I save the administration user
    Then the "Save succeeded" confirmation toast should be displayed in the administration
