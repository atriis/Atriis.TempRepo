# Test Name: 20386 User cannot select a date of birth for travelers under 18 years old
# Description:
# Status: Active
# Labels: Regression,traveler,Adding Passengers,DOB,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-04-17T08:37:06Z
# Updated: 2026-01-08T08:55:46Z

@regression @profile @dob @adding-passengers
Feature: 20386 User cannot select a DOB for travelers under 18
  As a corporate traveler
  I want the system to prevent selecting a date of birth for travelers under 18
  So that age restrictions are enforced

  @priority:high
  Scenario: Date of birth picker does not allow selecting a date for travelers under 18
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    # TODO: Step needs implementation — click ".has-text-weight-semibold" then ".add-guest-btn"
    # DSL candidate: Search.openAddGuestTravelerForm(page)
    When I open the add guest traveler form
    # TODO: Step needs implementation — click on DOB field (el-id date picker)
    # DSL candidate: Search.openGuestDobPicker(page)
    And I open the date of birth picker for the guest traveler
    # TODO: Step needs implementation — assert year displayed is current year - 18 (e.g., 2008)
    # DSL candidate: Search.verifyDobYearRestriction(page, 18)
    Then the date of birth picker should show the year restricted to 18 years ago
    # TODO: Step needs implementation — assert ".hide-day .el-picker-panel__body" is visible
    # DSL candidate: Search.verifyDobPickerStillOpen(page)
    And the date picker should remain open for month selection
