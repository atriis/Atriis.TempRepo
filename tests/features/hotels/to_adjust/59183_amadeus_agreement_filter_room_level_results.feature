# Test Name: 59183 Amadeus - Hotel - Room level results are displayed when agreement is configured with "Separate from other agreement" checked
# Description: 
# Status: Active
# Labels: Regression,Hotel,Amadeus,room level,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-10T10:09:31Z
# Updated: 2025-07-07T10:24:14Z

@regression @provider:amadeus
Feature: 59183 Amadeus - Agreement filter shows separate room level results
  As a corporate traveler
  I want to filter by agreement hotels and see room level results displayed properly
  So that I can book from the company's negotiated hotel agreements

  @priority:medium
  Scenario: Agreement filter in hotel results shows room level results correctly
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    When I filter results by "Agreement" checkbox
    And I select the first hotel result
    # TODO: Create step "Then the room level results should be displayed for the agreement hotel" that calls DSL verifyRoomLevelResultsDisplayed in RoomLevelResults.js
