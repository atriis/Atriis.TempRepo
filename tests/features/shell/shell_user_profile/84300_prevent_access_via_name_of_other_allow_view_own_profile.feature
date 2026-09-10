# Test Name: Prevent access via name of other, allow view own profile
# Description: A booker holding "Prevent updating others and own profile" reaches their OWN profile
#              from their traveller name tag on the search page — read-only — while another
#              traveller's name tag is not a link at all, so that profile can never be opened.
# Status: Active
# ADO: Test Case 84300
# Labels: Regression,Shell,Profile,Privileges,Roles
# Owner: Pini Harush
# Created: 2026-09-07
#
# Preconditions (data, not automatable here):
#   - "Prevent@profileupdate.com" holds "Prevent updating others and own profile" and NEITHER
#     "Can view profile of other users" (CanViewProfile) nor "Can edit and view profile for other
#     users" (CanEditAndViewProfile)
#   - That user's profile renders the name "Prevent Prevent"
#   - A traveller matching the autocomplete term "view" exists and renders as "View Profile"
#
# Why the two halves differ, from the app source — trip-traveler-tag.vue#isUserCanViewProfile is
#   corporateUserId === loggedinUser.id || permissions.includes('CanEditAndViewProfile')
#                                       || permissions.includes('CanViewProfile')
# and the tag's `is-clickable` class plus goToUserApp's early return are both bound to it. So for
# this booker:
#   - own tag  -> the own-profile branch is true -> the tag IS a link and /user/:userId opens in a
#                 new tab, but the "Prevent updating..." privilege leaves the form read-only;
#   - other's tag -> no branch is true -> the class is omitted AND goToUserApp returns before
#                 openNewWindow, so clicking it opens nothing. That is what the closing step
#                 asserts — access is prevented at the name tag, not on the profile page.
#
# The own-profile half is page-scoped, not dialog-scoped: the name tag window.open()s /user/:userId
# (see profile.steps.js "I click the traveler name on the search page", which repoints the world at
# the new tab), which is why the tab has to be closed before the search page can be used again.
#
# Covers the privilege the 49858 conversion left out.
# shell_user_profile/49858_validate_edit_profile_from_pax_name_and_gender_is_mandatory.feature is
# scoped to "Can edit and view profile for other users" and says so: the Testim export's
# view-only, prevent-updating and own-profile-only cases "were dropped rather than converted".
# This file is the prevent-updating one, so the two are complementary and neither duplicates the
# other.
#
# Its Testim original — testim/active/regression_set_new_front/flights/flights_amadeus/
# 49858_privileges_for_view_and_edit_profile_and_validate_gender_is_mandatory.js, scenario
# "Prevent updating others and own profile" — closes with "the traveler profile page is not
# editable" for "View Profile". Per the source above that assertion cannot pass: reaching the
# profile at all needs clickLastTravelerNameLink, whose selector requires the `is-clickable`
# class this tag deliberately lacks (see ProfilePage.clickLastTravelerNameLink). Asserting the
# tag is not a link is what the export set out to prove, so this file is the corrected, runnable
# version of it.

# ADO Test Case ID: 84300
@ado:84300
@regression @shell @profile @privileges @roles @traveler
Feature: 84300 Shell - Prevent access via name of other, allow view own profile
  As a booker who may not update any profile, including my own
  I want my own name tag to open my profile read-only, and another traveller's name tag to not be a link
  So that I can review my own details while other travellers' profiles stay out of reach

  @priority:high
  Scenario: Prevent-update privilege - own profile opens read-only from the name tag, another traveller's does not open at all
    Given I am logged in as "Prevent@profileupdate.com" booking a new trip
    And I have added myself as the traveler
    Then the traveler name "Prevent Prevent" should be visible in the travelers list
    When I click the traveler name on the search page
    Then I should see the heading "Prevent Prevent"
    And the traveler profile page is not editable
    When I close the traveler profile tab and return to the search page
    And I remove all travelers
    And I add a traveler by name "view" from the search autocomplete
    Then the traveler name "View Profile" should be visible in the travelers list
    And the traveler name "View Profile" on the search page should not be clickable
