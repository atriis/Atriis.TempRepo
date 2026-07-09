# Test Name: 34460 Share quotes email is sent when email display name is set
# Description:
# Status: Active
# Labels: Share Itinerary,Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: Noam Miller
# Created: 2023-08-14T08:08:27Z
# Updated: 2025-03-04T01:20:04Z

@regression @shell
Feature: 34460 - Share quotes email is sent when email display name is set
  As a user sharing flight quotes with a traveler
  I want the share-quotes email to be delivered when an email display name is configured
  So that the traveler receives the price offer email with the correct sender display name

  Scenario: Share-quotes email is sent to the traveler when an email display name is set
    Given I am logged in as "sharequote@club.com" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "SFO" to "LAX"
    # TODO: no catalog phrase matches selecting specific quote share buttons from results (closest phrase adds a safety-text assertion this test does not perform)
    And I select two quotes to share from the results page
    # TODO: no catalog phrase matches emailing the selected quotes to a specific recipient/traveler from the results page
    And I email the selected quotes to the traveler
    # TODO: source Validate_email_was_sent() has an empty body (manual email-validation step); this is the core assertion of the test
    Then the share quotes email should be sent with the configured email display name
    And I exit share mode
