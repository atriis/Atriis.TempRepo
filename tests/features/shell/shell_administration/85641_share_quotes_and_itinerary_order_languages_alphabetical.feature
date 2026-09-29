# Test Name: 85641 Share Quotes and Share Itinerary Order languages Alphabetical
# Description: The "Language" dropdown in the trip cart's Share quotes and Share itinerary dialogs lists its
#              languages in alphabetical order (app-share-quotes.ts sortedLanguageOpts sorts by label).
# Status: Active
# Labels: Regression,Shell,Administration,Share Quote
# ADO: Test Case 85641 (Tests User Story 85620)
# Owner: Pini Harush
# Created: 2026-09-29

# ADO Test Case ID: 85641
@ado:85641
@regression @shell @administration @share-quote @share-itinerary @tc-85641
Feature: 85641 Share Quotes - Order languages Alphabetical
  As a user sharing a trip
  I want the "Language" dropdown in the Share quotes and Share itinerary dialogs to list languages alphabetically
  So that I can find the email language quickly

  @priority:medium
  Scenario: Share quotes and Share itinerary language dropdowns list languages in alphabetical order
    Given I am logged in as "pax@pax12.com"
    When I navigate to the trips page
    And I select the "Upcoming trips" quick view on the trips page
    And I click the first trip from the trip list
    And I click the share quote button
    And I open the language dropdown in the share dialog
    Then the language dropdown options in the share dialog should be sorted alphabetically
    When I close the share dialog
    And I click the share itinerary button
    And I open the language dropdown in the share dialog
    Then the language dropdown options in the share dialog should be sorted alphabetically
