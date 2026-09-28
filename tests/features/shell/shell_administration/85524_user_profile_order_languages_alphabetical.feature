# Test Name: 85524 User Profile Order languages Alphabetical
# Description: The "Default language for emails" dropdown on My profile > Personal Details lists its
#              languages in alphabetical order (personal-details-form.ts languageOpts sorts by label).
# Status: Active
# Labels: Regression,Shell,Administration,Profile
# ADO: Test Case 85524 (Tests User Story 85453)
# Owner: Pini Harush
# Created: 2026-09-28

# ADO Test Case ID: 85524
@ado:85524
@regression @shell @administration @profile @tc-85524
Feature: 85524 User Profile - Order languages Alphabetical
  As a user
  I want the "Default language for emails" dropdown in my profile to list languages alphabetically
  So that I can find my language quickly

  @priority:medium
  Scenario: Default language for emails dropdown lists languages in alphabetical order
    Given I am logged in as "app@app12.com"
    When I navigate to my user profile
    Then the Personal Details tab should be active showing the "Title" field label
    When I open the "Default language for emails" dropdown in my profile
    Then the "Default language for emails" dropdown options in my profile should be sorted alphabetically
