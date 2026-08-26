# Test Name: 83407 Profile - Can view my profile only
# Description: A user without the "Can view profile of other users" privilege sees no "Manage profiles"
#              entry in the header profile menu — only "My profile" and "Log out" — and can open their
#              own profile.
# Status: Active
# Labels: Regression,Shell,Profile,Privileges,Manage profiles
# ADO: Test Case 83407
# Owner: Pini Harush
# Created: 2026-08-25
#
# Preconditions (data, not automatable here):
#   - "Prevent@update.otr" does NOT hold the "Can view profile of other users" privilege
#     (it holds only "Prevent updating others and own profile" — see TC 83279)
#   - The Manage-profiles feature flag is enabled for the corporation, so the entry's absence
#     proves the privilege gate rather than the flag being off (app-profile-menu.ts: canManageProfiles
#     is isManageProfilesEnabled && canManageOtherProfiles(permissions))
#
# The "Manage profiles" absence is asserted while the dropdown is still open, before "My profile"
# is clicked — clicking "My profile" calls closeMenu() and the entry would then be absent for the
# wrong reason.

# ADO Test Case ID: 83407
@ado:83407
@regression @shell @profile @privileges @tc-83407
Feature: 83407 Profile - Can view my profile only
  As a user without the "Can view profile of other users" privilege
  I want the header profile menu to expose only my own profile
  So that other users' profiles stay out of reach

  @priority:high
  Scenario: User without the view-other-profiles privilege sees only My profile
    Given I am logged in as "Prevent@update.otr"
    When I click my user initials in the header
    Then the "Manage profiles" option should not be displayed in the profile menu
    And the "My profile" option should be displayed in the profile menu
    And the "Log out" option should be displayed in the profile menu
    When I open "My profile" from the profile menu
    Then the Personal Details tab should be active showing the "Title" field label
