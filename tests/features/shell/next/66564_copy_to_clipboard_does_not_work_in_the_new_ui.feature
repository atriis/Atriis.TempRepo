# Test Name: 66564 Copy to clipboard does not work in the new ui
# Description:
# Status: Active
# Labels: Regression,Daily Shell,2026 plan 2
# Owner: Yael
# Created: 2025-09-08T08:52:23Z
# Updated: 2026-02-16T02:41:36Z
#
# Converted from Testim source:
#   tests/testim/active/regression_set_new_front/shell/general/66564_copy_to_clipboard_does_not_work_in_the_new_ui.js
# Eventual home: tests/features/shell/shell_share_quote_or_itinerary/ (alongside 32088 and 26965).
#   New conversions land in next/ first per the conversion contract.

@regression @shell @flights @share-itinerary
Feature: 66564 - Copy to clipboard does not work in the new UI
  As a travel booker
  I want the "Copy to clipboard" action in the results-page share dialog to work
  So that I can share a price offer without being redirected to a broken page

  @priority:medium
  Scenario: Copy to clipboard in the results page share dialog keeps me on the same page
    Given I am logged in as "jskrl@jskrl.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "EWR" to "LAX"
    And the flight results should be available
    And I click on the "Share" button
    And I click on the 1 share button in results page
    And I click on the "Share" button to open the share dialog
    Then I wait to see "Include in price offer" field in share dialog
    When I click the copy to clipboard button in the share dialog
    Then I should see a success notification 
