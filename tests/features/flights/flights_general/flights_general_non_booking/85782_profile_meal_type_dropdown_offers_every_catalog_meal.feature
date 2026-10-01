# Test Name: 85782 Profile - Meal type dropdown offers every catalog meal and saves Peanut-Free Meal
# Source: ADO Bug #84697 - [Flights][Profiles] OBT profile Meal type dropdown misses some of the options available through admin
#
# The options are compared with GET /api/v3/meals, captured when the profile reloads.
# GFML is saved before PFML so the PFML save is a real change whatever the account held.

# ADO Test Case ID: 85782
@ado:85782
@regression @flights @general @profile @travel-preferences
Feature: 85782 Profile - Meal type dropdown offers every catalog meal and saves Peanut-Free Meal
  As a corporate traveller
  I want my profile's Meal type dropdown to offer every meal the agent site offers
  So that I can record an allergy meal such as Peanut-Free Meal myself

  @priority:high
  Scenario: Meal type dropdown matches the meal catalog and keeps Peanut-Free Meal after a reload
    Given I am logged in as "jbloom@frosch.corp"
    When I navigate to my user profile
    And I open the travel preferences tab in my profile
    And I select the "Gluten Intolerant Meal (GFML)" meal type in my travel preferences
    And I save the travel preferences
    And I reload my profile on the travel preferences tab
    Then the meal type in my travel preferences should be "Gluten Intolerant Meal (GFML)"
    When I open the meal type dropdown in my travel preferences
    Then the meal type options should be the meals catalog in the same order
    And "Regular" should be the first meal type option
    And the meal type options should include:
      | Allergen-Free Meal (ALML)     |
      | Fish Meal (FSML)              |
      | High Fiber Meal (HFML)        |
      | Kosher Vegetarian Meal (KVML) |
      | No Fish Meal (NFML)           |
      | No Meal (NOML)                |
      | No Salt Meal (NSML)           |
      | Peanut-Free Meal (PFML)       |
    When I select the "Peanut-Free Meal (PFML)" meal type in my travel preferences
    And I save the travel preferences
    And I reload my profile on the travel preferences tab
    Then the meal type in my travel preferences should be "Peanut-Free Meal (PFML)"
