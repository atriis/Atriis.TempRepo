# Test Name: 49858 validate edit profile from pax name and gender is mandatory
# Description:
# Status: Active
# Labels: Regression,Profile,Role,Privileges,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-10-31T02:00:12Z
# Updated: 2026-02-17T06:35:55Z
#
# Converted from tests/testim/active/regression_set_new_front/flights/flights_amadeus/
#   49858_privileges_for_view_and_edit_profile_and_validate_gender_is_mandatory.js
# Filed under shell rather than flights_amadeus: the export contains no flight search and no
# Amadeus step — every case is a profile-privilege check driven from the traveller section.
#
# Scoped to the "Can edit and view profile for other users" privilege only. The Testim export also
# covered the view-only, prevent-updating and own-profile-only privileges and a direct-link case;
# those were dropped rather than converted, so this file is one scenario and not the export's seven.
#
# Every step is implemented, and the file now lives in shell_user_profile/ — which suite-shell.yml
# runs as the "shell-user-profile" suite — so it is in the chain rather than parked.
#
# The prevent-updating privilege the export also covered is automated separately, in
# 84300_prevent_access_via_name_of_other_allow_view_own_profile.feature.
#
# Preconditions (data, not automatable here):
#   - "edit@profile.com" holds "Can edit and view profile for other users"
#   - Travellers matching the autocomplete terms "Edit", "View" and "no gender" exist; the first two
#     are complete profiles, and "no gender" has no gender on file while the corporation mandates it
#
# The Testim helper this scenario came from is named the opposite of what its body does, and the
# body is what actually ran: validate_can_see_but_can_t_edit_profile_of_others_1 (edit@profile.com)
# saves a change and asserts the Success toast — that user CAN edit another traveller's profile.
#
# The profile field ids in the export (#el-id-3193-34, #el-id-653-34) are Element Plus generated ids
# and do not survive conversion. Each asserted the opened profile's first name, so they map to
# "the traveler profile page belongs to" rather than to a heading check.

# ADO Test Case ID: 49858
@ado:49858
@regression @shell @profile @privileges @roles @traveler
Feature: 49858 validate edit profile from pax name and gender is mandatory
  As a booker whose profile privileges decide whose details I may open and change
  I want each privilege to grant exactly the profile access it names, and an incomplete traveller
  to be refused with the mandatory-details warning
  So that travellers' details stay protected and an unbookable traveller never reaches the trip

  @priority:high
  Scenario: Can edit and view profile for other users - own and other profiles are editable, and gender is mandatory
    Given I am logged in as "edit@profile.com" booking a new trip
    And I have added myself as the traveler
    Then the traveler name "Edit Profile" should be visible in the travelers list
    When I click the traveler name on the search page
    Then the traveler profile page belongs to "Edit"
    When I enter a random middle name in the traveler profile
    And I save the personal details
    Then I should see a success notification
    And the middle name in the traveler profile should be the value I entered
    When I close the traveler profile tab and return to the search page
    And I remove all travelers
    And I add a traveler by name "View" from the search autocomplete
    Then the traveler name "View Profile" should be visible in the travelers list
    When I click the traveler name on the search page
    Then the traveler profile page belongs to "View"
    When I enter a random middle name in the traveler profile
    And I save the personal details
    Then I should see a success notification
    And the middle name in the traveler profile should be the value I entered
    When I close the traveler profile tab and return to the search page
    And I remove all travelers
    And I add a traveler by name "no gender" through the empty traveler slot
    Then the user profile popup is displayed
    And the gender field shows the required-field error "This field is required"
    When I close the user profile popup
    And I click the logout icon
