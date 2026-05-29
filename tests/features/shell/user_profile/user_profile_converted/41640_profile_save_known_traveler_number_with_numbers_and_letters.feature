# Test Name: 41640 "My Profile" - It is possible to save known traveler number with numbers and letters
# Description:
# Status: Active
# Labels: Regression,Profile,known traveler,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-01-25T10:21:57Z
# Updated: 2025-07-14T07:33:12Z

@regression @profile @known-traveler
Feature: 41640 Profile - Save known traveler number with numbers and letters
  As a corporate traveler
  I want to save a known traveler number containing both numbers and letters
  So that my TSA PreCheck or Global Entry number is stored correctly

  @priority:medium
  Scenario: Save known traveler number with alphanumeric characters
    Given I am logged in as "ruimendes@amadeus.com"
    When I navigate to my user profile
    # TODO: Step needs implementation — click "[id='tab-passportsAndVisas'] p"
    # DSL candidate: Profile.openPassportsAndVisasTab(page)
    And I open the passports and visas tab in my profile
    # TODO: Step needs implementation — click known traveler input, fill random alphanumeric value
    # DSL candidate: Profile.enterKnownTravelerNumber(page, value)
    # NOTE: Testim used a random-value-generator — use a random string like "ABC123DEF"
    And I enter a known traveler number with alphanumeric characters
    # TODO: Step needs implementation — click the save/submit button
    # DSL candidate: Profile.saveProfileChanges(page)
    And I save the profile changes
    Then I should see a success notification
