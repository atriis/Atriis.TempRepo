# Test Name: 30630 Fill mandatory field for other corp user
# Description: when adding user with empty mandatory field in the administration - the profile pops up, the user see an error message, can update the field, and the field updated in the administration
# Status: Active
# Labels: Regression,mandatory fields,Profile,Administration,Adding Passengers,never failed,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-10-22T10:12:50Z
# Updated: 2026-02-17T06:41:03Z

@regression @profile @mandatory-fields @administration
Feature: 30630 Fill mandatory field for other corp user
  As an administrator
  I want the profile to pop up with an error when adding a traveler with missing mandatory fields
  So that I can fill in the required information before proceeding

  @priority:high
  Scenario: Profile pops up with error message when adding a traveler with empty mandatory mobile field
    Given I am logged in as "Mendy@Tori.com"
    When I navigate to the administration page
    And I clear the mobile field for user "Roman datori" in the administration
    And I book a new trip
    And I add a traveler by name "roman datori" from the search autocomplete
    Then the profile popup should display "Mobile" as a mandatory field
    When I try to save the profile popup with empty mandatory fields
    Then I should see the validation message "Invalid phone number"
    And I should see the message "Please fill all required fields which are marked"
    When I enter a mobile number in the profile popup with country code "972" area code "50" and number "8521478"
    Then I should see a success notification
    When I switch to the administration page
    And I search for user "Roman datori" in the administration
    Then the mobile field should show country code "972" area code "50" and number "8521478"
