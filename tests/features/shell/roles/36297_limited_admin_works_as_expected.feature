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
    And I click add new user in the administration
    Then the new corporate user form should display the "First Name:" field
    When I close the add new user popup in the administration
    And I search for user "Morrissey Smith" in the administration
    When I fill the first mandatory user field with a random value in the administration
    And I save the administration user 
    Then the "Save succeeded" confirmation toast should be displayed in the administration
    Then the "Active" filter should be visible in the administration user search bar
    When I clear the user search in the administration
    Then the inactive users filter should be unchecked in the administration
    Then the active users filter should be checked in the administration
    Then only active users should be listed in the administration
