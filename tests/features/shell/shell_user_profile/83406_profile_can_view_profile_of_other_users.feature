# Test Name: 83406 Can view profile of other users
# Description: A user holding the "Can view profile of other users" privilege reaches another
#              user's profile through the header profile menu -> Manage profiles -> the row's
#              pencil icon, which opens that profile in the edit dialog over the dimmed list.
# Status: Active
# Labels: Regression,Shell,Profile,Privileges,Manage profiles
# ADO: Test Case 83406 (rev 3)
# Owner: Pini Harush
# Created: 2026-08-25
#
# Preconditions (environment/data, not automatable here):
#   - Feature flag "Atriis.App.OBT.IsManageProfilesEnabled" is ON for the corporation under test.
#     app-profile-menu.ts gates the menu entry on `isManageProfilesEnabled && canManageOtherProfiles`,
#     and manage-profiles.ts gates the route on the same flag. With the flag off the dropdown renders
#     exactly as it did before the feature (My profile + Log out) — see Atriis.App commit 1d00e51b
#     "Keep the profile menu identical when the manage-profiles flag is off".
#     >>> Verified OFF on staging on 2026-08-25: this scenario is blocked at the third step until
#     >>> the flag is enabled. The privilege half of the gate is fine — TC 83278 passes with the
#     >>> same user, which proves vvv@only.com holds CanViewProfile.
#   - "vvv@only.com" holds the "Can view profile of other users" privilege (CanViewProfile)
#   - At least one other profile is visible to that user in the Manage profiles list
#
# "Manage profiles" is opened with openInNewTab (app-profile-menu.ts), so the step that clicks it
# swaps the World's active page onto the new tab. Everything after it runs against that tab.

# ADO Test Case ID: 83406
@ado:83406
@regression @shell @profile @privileges @manage_profiles
Feature: 83406 Profile - Can view profile of other users
  As a user with the "Can view profile of other users" privilege
  I want to open another user's profile from the Manage profiles list
  So that I can review the traveller details I am entitled to see

  @priority:high
  Scenario: User with the view-other-profiles privilege opens a profile from Manage profiles
    Given I am logged in as "vvv@only.com"
    When I click my user initials in the header
    And I open "Manage profiles" from the profile menu
    Then the Manage profiles list should be displayed
    When I hover over the first profile row in the Manage profiles list
    Then the edit icon should be visible on the hovered profile row
    When I open that profile by clicking the edit icon
    Then the user profile should be displayed for the selected user
