# Test Name: 58334 Hotels - After scrolling down in the hotel level and selecting a hotel from the bottom page, user is redirected to the room level top page
# Description: 
# Status: Active
# Labels: Regression,Hotel,room level,general,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-13T02:06:29Z
# Updated: 2025-02-13T02:27:07Z

@regression @provider:amadeus
Feature: 58334 Amadeus - Scroll to last hotel and redirect to room level at top
  As a corporate traveler
  I want to scroll to the last hotel in search results and click it
  So that I am redirected to room level results and the page starts at the top

  @priority:low
  Scenario: Scrolling to last hotel and clicking redirects to room level at page top
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I wait to see view rates text in results page
    When I select the last hotel result
    Then the room level page should be displayed at the top
