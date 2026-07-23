# Test Name: 66531 Trip opens in a new tab when user has 'Booker' privileges
# Description:
# Status: Active
# Labels: traveler,Regression,Privileges,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-05T05:21:41Z
# Updated: 2025-10-28T02:18:03Z

@regression @shell @roles @privileges @trips @booker
Feature: 66531 - Trip opens in a new tab when user has 'Booker' privileges
  As a corporate travel booker with 'Booker' privileges
  I want opening a trip from my trip list to take me to the trip overview
  So that I can review a booked trip's details even though I only manage bookings for others

  Scenario: Booker user opens an in-travel trip and sees the trip overview
    Given I am logged in as "ruimariano@amadeus.com"
    When I navigate to the trips page
    And I click active trips tab
    And I open the first trip from the trip list
    # TODO: assert the trip Overview tab/page is displayed (waitForText "#tab-overview > div" == "Overview") — back with Trips.verifyOverviewTabDisplayed
    Then the trip overview tab should be displayed
