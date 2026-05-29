# Test Name: 63539 Allow to select and unselect seat preference
# Description:
# Status: Active
# Labels: Daily Shell,Regression,2026 plan 2
# Owner: Yael
# Created: 2025-06-17T07:07:33Z
# Updated: 2025-06-20T01:17:30Z

@regression @profile @travel-preferences @daily-shell
Feature: 63539 Profile - Select and unselect seat preference
  As a corporate traveler
  I want to select and unselect my seat preference in my travel preferences
  So that I can update my seating preferences as needed

  @priority:medium
  Scenario: Select a seat preference and then clear it
    Given I am logged in as "TECHNOLOGIESCH@e.com" booking a new trip
    And I have added myself as the traveler
    # TODO: Step needs implementation — click ".traveler-name"
    # DSL candidate: Profile.openTravelerProfileFromName(page)
    When I open the traveler profile from the traveler name
    # TODO: Step needs implementation — click "[id='tab-travelPreferences'] p"
    # DSL candidate: Profile.openTravelPreferencesTab(page)
    And I open the travel preferences tab in my profile
    # TODO: Step needs implementation — click seat preference dropdown, select an option
    # DSL candidate: Profile.selectSeatPreference(page)
    And I select a seat preference from the dropdown
    And I save the profile changes
    # TODO: Step needs implementation — verify selected preference persists after save
    # DSL candidate: Profile.verifySeatPreferenceSaved(page)
    Then the seat preference should be saved
    # TODO: Step needs implementation — click placeholder/clear to deselect
    # DSL candidate: Profile.clearSeatPreference(page)
    When I clear the seat preference selection
    # TODO: Step needs implementation — verify seat preference is back to placeholder state
    # DSL candidate: Profile.verifySeatPreferenceCleared(page)
    Then the seat preference should be cleared
