# Test Name: 49858 privileges for view and edit profile and validate gender is mandatory
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
# Parked in shell_blocked/user_profile_blocked/, which suite-shell.yml deliberately never runs: the
# eight step definitions this conversion needs were not kept, so 27 of its 98 steps are undefined.
# Implement them with @todo-pipeline and move the file to shell_user_profile/ to put it in the chain.
#
# Preconditions (data, not automatable here):
#   - "View@profile.com" holds ONLY "Can view profile of other users"
#   - "edit@profile.com" holds "Can edit and view profile for other users"
#   - "Prevent@profileupdate.com" holds "Prevent updating others and own profile"
#   - "OWN@PROFILE.com" holds "Prevent updating other profiles" but may still edit its own
#   - Travellers matching the autocomplete terms "View", "edit"/"Edit", "no gender" and
#     "empty field" exist; "no gender" has no gender on file and "empty field" is missing a
#     different mandatory field
#
# Three of the Testim helper functions are named the opposite of what their bodies do. The
# scenarios below follow the BODIES, which is what actually ran:
#   - validate_can_see_but_can_t_edit_profile_of_others_1 (edit@profile.com) saves a change and
#     asserts the Success toast — that user CAN edit another traveller's profile
#   - validate_can_edit_own_profile_1 (Prevent@profileupdate.com) only runs a negative check with
#     no Save — that user CANNOT edit their own profile
#   - validate_can_t_edit_own_profile (OWN@PROFILE.com) saves a change successfully — that user CAN
#     edit their own profile
#
# The profile field ids in the export (#el-id-3193-34, #el-id-653-34, #el-id-9513-34, #el-id-83-34)
# are Element Plus generated ids and do not survive conversion. Each asserted the opened profile's
# first name, so they map to "the traveler profile page belongs to" rather than to a heading check.
# Only #88 used a real selector (h1) and asserted the full name, so that one stays a heading check.

# ADO Test Case ID: 49858
@ado:49858
@regression @shell @profile @privileges @roles @traveler
Feature: 49858 Profile - Privileges for viewing and editing profiles, and gender is mandatory
  As a booker whose profile privileges decide whose details I may open and change
  I want each privilege to grant exactly the profile access it names, and an incomplete traveller
  to be refused with the mandatory-details warning
  So that travellers' details stay protected and an unbookable traveller never reaches the trip

  @priority:high
  Scenario: Can view profile of other users - own profile is editable, another traveller's is read-only
    Given I am logged in as "View@profile.com" booking a new trip
    And I have added myself as the traveler
    Then the traveler name "View Profile" should be visible in the travelers list
    When I click the traveler name on the search page
    # TODO: new step - assert the opened profile page belongs to the expected user
    Then the traveler profile page belongs to "View"
    # TODO: new step - fill the profile's Middle Name field with a random value (Testim
    #       'random-value-generator' step, variable middle1, selector #el-id-5027-35)
    When I enter a random middle name in the traveler profile
    And I save the personal details
    Then I should see a success notification
    # TODO: new step - re-read the Middle Name field and compare against the value entered above
    And the middle name in the traveler profile should be the value I entered
    # TODO: new step - close the profile tab opened by "I click the traveler name on the search
    #       page" and repoint the world at the search page (Testim close_tab)
    When I close the traveler profile tab and return to the search page
    And I remove all travelers
    And I add a traveler by name "edit" from the search autocomplete
    Then the traveler name "Edit Profile" should be visible in the travelers list
    When I click the traveler name on the search page
    Then the traveler profile page is displayed
    And the traveler profile page is not editable
    When I close the traveler profile tab and return to the search page
    And I click the logout icon

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
    # TODO: new step - select the traveller through the leftover empty traveller slot instead of
    #       the "Add traveller" button, because the add is expected to be refused
    And I add a traveler by name "no gender" through the empty traveler slot
    Then the user profile popup is displayed
    # TODO: new step - assert the required-field error rendered under the Gender select
    And the gender field shows the required-field error "This field is required"
    When I close the user profile popup
    And I click the logout icon

  @priority:high
  Scenario: Prevent updating others and own profile - neither own nor another traveller's profile is editable
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
    When I click the traveler name on the search page
    Then the traveler profile page is not editable
    # TODO (disabled in Testim: if(false)): a second 'negative-element-validation' marker sat here
    #       with no selector and no expected text, so there is nothing to convert.
    When I close the traveler profile tab and return to the search page
    And I click the logout icon

  # Disabled in the Testim export - validate_can_t_see_or_edit_profile_of_others opened with
  # `if (true) { return; }`, so this flow has never actually run. Converted rather than dropped, at
  # the QA engineer's request, so the coverage is visible and can be enabled once verified.
  @wip @priority:medium
  Scenario: Prevent updating others and own profile - a traveller without gender is refused
    Given I am logged in as "Prevent@profileupdate.com" booking a new trip
    When I remove all travelers
    And I add a traveler by name "no gender" through the empty traveler slot
    Then the mandatory details are missing popup is displayed
    And the mandatory details are missing popup states "profile has missing details and cannot be added to the reservation."
    When I close the mandatory details are missing popup

  # Disabled in the Testim export - validate_warning_pop_up_when_adding_traveler_without_gender
  # opened with `if (true) { return; }`. Same flow as the scenario above but for a traveller whose
  # missing mandatory field is not gender.
  @wip @priority:medium
  Scenario: Prevent updating others and own profile - a traveller with an empty mandatory field is refused
    Given I am logged in as "Prevent@profileupdate.com" booking a new trip
    When I add a traveler by name "empty field" through the empty traveler slot
    Then the mandatory details are missing popup is displayed
    And the mandatory details are missing popup states "profile has missing details and cannot be added to the reservation."
    When I close the mandatory details are missing popup

  @priority:high
  Scenario: Prevent updating other profiles - own profile is editable, others are read-only, and incomplete travellers are refused
    Given I am logged in as "OWN@PROFILE.com" booking a new trip
    And I have added myself as the traveler
    Then the traveler name "OWN PROFILE" should be visible in the travelers list
    When I click the traveler name on the search page
    Then the traveler profile page belongs to "OWN"
    When I enter a random middle name in the traveler profile
    And I save the personal details
    Then I should see a success notification
    And the middle name in the traveler profile should be the value I entered
    When I close the traveler profile tab and return to the search page
    And I remove all travelers
    And I add a traveler by name "view" from the search autocomplete
    Then the traveler name "View Profile" should be visible in the travelers list
    When I click the traveler name on the search page
    Then the traveler profile page is not editable
    # TODO (disabled in Testim: if(false)): a second 'negative-element-validation' marker sat here
    #       with no selector and no expected text, so there is nothing to convert.
    When I remove all travelers
    And I add a traveler by name "no gender" through the empty traveler slot
    Then the mandatory details are missing popup is displayed
    And the mandatory details are missing popup states "profile has missing details and cannot be added to the reservation."
    When I close the mandatory details are missing popup
    And I add a traveler by name "empty field" through the empty traveler slot
    Then the mandatory details are missing popup is displayed
    And the mandatory details are missing popup states "profile has missing details and cannot be added to the reservation."
    When I close the mandatory details are missing popup
    And I click the logout icon

  @priority:medium
  Scenario: A user profile cannot be opened from a direct link
    Given I am logged in as "OWN@PROFILE.com" booking a new trip
    And I have added myself as the traveler
    # TODO: new step - navigate straight to /user/{userId}?tripId={tripId} (Testim went to
    #       https://ui.gtp-staging.com/user/53270182?tripId=3380622)
    When I open the user profile deep link for user "53270182" on trip "3380622"
    # TODO: new step - assert the profile page did NOT render for a link the user may not follow
    Then the traveler profile page is not displayed
