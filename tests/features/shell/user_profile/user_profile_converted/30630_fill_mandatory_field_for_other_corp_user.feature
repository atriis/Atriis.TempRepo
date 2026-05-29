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
    # TODO: Step needs implementation — click "[to='/'] .material-symbols-outlined", wait for admin form
    # DSL candidate: Profile.navigateToAdministration(page)
    When I navigate to the administration page
    # TODO: Step needs implementation — go to Users tab, search user, open contact info, clear mobile fields, save
    # DSL candidate: Profile.clearUserMobileInAdmin(page, userName)
    And I clear the mobile field for user "Roman datori" in the administration
    And I book a new trip
    # TODO: Step needs implementation — click traveler-name, type in autocomplete, select from dropdown
    # DSL candidate: Search.addTravelerFromAutocomplete(page, name)
    And I add a traveler by name "roman datori" from the search autocomplete
    # TODO: Step needs implementation — assert ".mandatory" text matches the field name
    # DSL candidate: Profile.verifyMandatoryFieldPopup(page, fieldName)
    Then the profile popup should display "Mobile" as a mandatory field
    # TODO: Step needs implementation — assert ".help" text matches expected message
    # DSL candidate: Profile.verifyValidationMessage(page, message)
    And I should see the validation message "Invalid phone number"
    # TODO: Step needs implementation — assert ".btns-container p" text matches
    # DSL candidate: Profile.verifyInfoMessage(page, message)
    And I should see the message "Please fill all required fields which are marked"
    # TODO: Step needs implementation — fill country code, area code, number in popup, click save
    # DSL candidate: Profile.enterMobileInPopup(page, { countryCode, areaCode, number })
    When I enter a mobile number in the profile popup with country code "972" area code "50" and number "8521478"
    Then I should see a success notification
    When I navigate to the administration page
    # TODO: Step needs implementation — navigate to Users, type name, click user, open contact info
    # DSL candidate: Profile.searchUserInAdmin(page, userName)
    And I search for user "Roman datori" in the administration
    # TODO: Step needs implementation — assert phone-number fields match expected values
    # DSL candidate: Profile.verifyMobileInAdmin(page, { countryCode, areaCode, number })
    Then the mobile field should show country code "972" area code "50" and number "8521478"
  #   DSL candidate: Profile.searchUserInAdmin(page, userName)
  #
  # TODO: Step "the mobile field should show country code {string} area code {string} and number {string}" — needs implementation:
  #   - Assert phone-number fields match expected values
  #   DSL candidate: Profile.verifyMobileInAdmin(page, { countryCode, areaCode, number })
