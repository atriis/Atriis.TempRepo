# Test Name: 36297 Limited admin works as expected
# Description:
# Status: Active
# Labels: Regression,Administration,limited admin,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-02-12T10:25:59Z
# Updated: 2025-02-12T11:17:09Z

@regression @shell @roles @privileges @administration
Feature: 36297 - Limited admin works as expected
  As a limited administrator
  I want to add a corporate user, edit a mandatory user field and filter the users list by status
  So that a limited-admin role can manage users and see only active users are shown by default

  Scenario: Limited admin adds a user, edits a mandatory field and confirms the active-users filter
    Given I am logged in as "brunatailita@bruna.com"
    When I navigate to the administration page
    # TODO: click the "Add new user" button in the admin Users view — Administration.clickAddNewUser (selector "[data-ng-click='onAddNewUserClicked()'] span")
    And I click add new user in the administration
    # TODO: assert the new corporate user form shows the given field label (proves limited admin may add users) — Administration.verifyNewUserFormField (selector "[name='newCorporateUserForm'] > :nth-child(2) > :nth-child(1) .block-display", expected "First Name:")
    Then the new corporate user form should display the "First Name:" field
    # TODO: close the add-new-user popup to return to the users list — Administration.closeAddNewUserPopup (selector "#popUpCloseBtn > div")
    When I close the add new user popup in the administration
    And I search for user "Morrissey Smith" in the administration
    # TODO: assert the Employee number field label is marked optional — Administration.verifyAdminUserFieldOptional (selector "[name='Employee number'] .bold", label text ends with "(Optional)")
    Then the "Employee number" field should be marked as optional in the administration
    # TODO: fill a mandatory dynamic user question with a generated random value (Testim random-value-generator, must be generated in code) — Administration.fillMandatoryUserFieldWithRandomValue (selector "#question_6731")
    When I fill the mandatory user field with a random value in the administration
    # TODO: click Save on the user record — Administration.saveUserRecordInAdmin (selector "[data-ng-click='onSaveClicked()']")
    And I save the user record in the administration
    # TODO: assert the "Save succeeded" confirmation toast appears — Administration.verifyAdminToast (selector ".toast-title", expected "Save succeeded")
    Then the "Save succeeded" confirmation toast should be displayed in the administration
    # TODO: assert the "Active" filter is visible in the admin user search bar — Administration.verifyAdminSearchBarFilter (selector ".admin-search-bar > :nth-child(3)", expected "Active")
    Then the "Active" filter should be visible in the administration user search bar
    # TODO: clear the user search box via the search clear icon — Administration.clearUserSearchInAdmin
    When I clear the user search in the administration
    # TODO: assert the "Inactive" users filter checkbox is unchecked — Administration.verifyInactiveUsersFilterUnchecked (selector "[data-ng-model='showInactive']", expect false)
    Then the inactive users filter should be unchecked in the administration
    # TODO: assert the "Active" users filter checkbox is checked — Administration.verifyActiveUsersFilterChecked (selector "[data-ng-model='showActive']", expect true)
    Then the active users filter should be checked in the administration
    # TODO: assert only active users are listed (first row status column reads "Active") — Administration.verifyOnlyActiveUsersListed (selector ".user-scroll-corporate tbody > :nth-child(1) > :nth-child(9)", expected "Active")
    Then only active users should be listed in the administration
