# Test Name: Role_Can_Edit_View_Travellers_Assigned
# Description: A user whose role carries only the "Can Edit and View Profile for Travellers Assigned"
#              privilege reaches Manage profiles from the header profile menu, and the list there is
#              scoped to exactly their own profile plus the travellers in their "who I can book for"
#              list — no other profile in the corporation is reachable.
# Status: Active
# Labels: Regression,Shell,Profile,Privileges,Travel Arranger,Manage profiles
# ADO: Test Case 84857, User Story 84779
# Owner: Pini Harush
# Created: 2026-09-16
#
# Preconditions (environment/data, not automatable here):
#   - Feature flag "Atriis.App.OBT.IsManageProfilesEnabled" is ON for the corporation under test.
#     app-profile-menu.ts gates the menu entry on `isManageProfilesEnabled && canManageOtherProfiles`,
#     and manage-profiles.ts gates the route on the same flag. With the flag off the dropdown renders
#     My profile + Log out only, and this scenario is blocked at the third step.
#   - "Stuart@Stuart.com"'s role holds "Can Edit and View Profile for Travellers Assigned" and does
#     NOT hold "Can edit and view profile for other users" — per US 84779 the broader privilege wins
#     and would widen the list to every user in the account, which is exactly what this asserts against.
#   - Stuart's "who I can book for" list holds exactly one traveller: Rita miller Franklin
#     (yael@atriis.com). The other row is the arranger's own profile, M,y Mail (sda@gmail.com).
#     The table below matches on EMAIL — the unique key on a corporate profile. The names ride
#     along so a failure reads as a person rather than a bare address, but they are NOT asserted:
#     renaming a profile must not fail a test about who a privilege can reach. They are written as
#     /api/v3/CorporateProfiles returns them, so the comma in "M,y" is a real stored value.
#   - 63996_profile_can_select_travel_arranger.feature signs in as this same Stuart and empties
#     that same "who I can book for" list before re-adding Rita, so the two must never overlap.
#     The shell-travel-arranger suite is pinned to "parallel": 1 in suite-shell.yml for exactly
#     that reason — do not raise it. If this scenario ever fails with missing:
#     ["Rita miller Franklin"], suspect a 63996 run that died between the remove and the re-add
#     and left Stuart's list empty. That is a data leftover, not the scoping regression this
#     test exists to catch.
#
# The assertion is deliberately a set equality, not a contains-check. This privilege is defined by
# what it does NOT grant, so "Rita is in the list" would pass just as well for a user who can see
# every profile in the corporation. Asserting that nothing ELSE is listed is the only form of this
# test that fails when the scoping regresses to the broad privilege's behaviour.
#
# "Manage profiles" is opened with openInNewTab (app-profile-menu.ts), so the step that clicks it
# swaps the World's active page onto the new tab. Everything after it runs against that tab.

# ADO Test Case ID: 84857
@ado:84857
@regression @shell @profile @privileges @travel-arranger @manage_profiles @us-84779
Feature: 84857 Travel arranger - 'Can Edit and View Profile for Travellers Assigned' scopes Manage profiles to the assigned travellers
  As a corporate user assigned as a travel arranger for other travellers
  I want Manage profiles to list only myself and the travellers I can book for
  So that I can keep their details accurate without being granted access to every profile in the account

  @priority:high
  Scenario: Role_Can_Edit_View_Travellers_Assigned - Manage profiles holds only the arranger and their assigned travellers
    Given I am logged in as "Stuart@Stuart.com"
    When I click my user initials in the header
    And I open "Manage profiles" from the profile menu
    Then the Manage profiles list should be displayed
    And the Manage profiles list should hold exactly these profiles:
      | name                 | email           |
      | M,y Mail             | sda@gmail.com   |
      | Rita miller Franklin | yael@atriis.com |
