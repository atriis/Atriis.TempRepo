# Test Name: 30631 Fill mandatory field for yourself
# Description: when adding yourself with empty mandatory field in the administration - the profile pops up, the user see an error message, can update the field, and the field updated in the administration
# Status: Active
# Labels: Regression,mandatory fields,Profile,Administration,Adding Passengers,never failed,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-10-22T10:50:57Z
# Updated: 2026-02-16T02:51:45Z

@regression @profile @mandatory-fields @administration
Feature: 30631 Fill mandatory field for yourself
  As a corporate traveler
  I want the profile to pop up with an error when I add myself with missing mandatory fields
  So that I can fill in the required information before proceeding

  @priority:high
  Scenario: Profile pops up with error message when adding yourself with empty mandatory mobile field
    Given I am logged in as "Mendy@Tori.com"
    When I navigate to the administration page
    And I clear the mobile field for user "mendy tori" in the administration
    And I book a new trip
    And I click to add myself as the traveler
    Then the profile popup should display "Mobile" as a mandatory field
    When I try to save the profile popup with empty mandatory fields
    Then I should see the validation message "Invalid phone number"
    And I should see the message "Please fill all required fields which are marked"
    When I enter a mobile number in the profile popup with country code "351" area code "50" and number "8521478"
    Then I should see a success notification
    When I switch to the administration page
    And I search for user "mendy tori" in the administration
    Then the mobile field should show country code "351" area code "50" and number "8521478"
