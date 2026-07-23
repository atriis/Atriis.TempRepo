# Test Name: 66530 Trip opens in the same tab when user has 'Traveler' privileges
# Description:
# Status: Active
# Labels: traveler,Regression,Privileges,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-05T05:04:51Z
# Updated: 2025-10-28T02:01:52Z

@regression @shell @roles @privileges @trips
Feature: 66530 - Trip opens in the same tab when user has 'Traveler' privileges
  As a user with only the 'Traveler' privilege
  I want opening one of my trips to load it in the current browser tab
  So that I stay within the application instead of a new tab being spawned

  Scenario: A Traveler-privileged user opens a cancelled trip and it renders in the same tab
    Given I am logged in as "lurdesmacedo@traveler.com"
    When I navigate to the trips page
    # TODO: filter the trips list by a status checkbox (e.g. "Cancelled") — back with Trips.filterTripsByStatus (open the trips-page filter panel .carriers-filter and tick the el-checkbox whose label text matches the option)
    And I filter the trips list by "Cancelled"
    # TODO: type a trip number into the trips-page search box [placeholder='Location, trip or travellers'] — back with Trips.searchTripNumber
    And I search for trip number "3536672" on the trips page
    # TODO: open the matching trip from the trips list (click the enabled trip row [aria-disabled='false'] / .app-label) — back with Trips.openTripFromResults
    And I open the trip from the trips list
    # TODO: assert the trip opened in the SAME browser tab (no popup/new page) and the Overview tab (.tab == 'Overview') is visible — back with Trips.verifyTripOpensInSameTab
    Then the trip should open in the same tab showing the Overview tab
