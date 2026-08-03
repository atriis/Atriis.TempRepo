# Bug: ADO #75337 - OBT - Pricing page - Incorrect time format for selected flights
# Zendesk: 297578
# On the 'Select Best Combination' / 'Your Selection' pricing page, flight times were shown in
# 24-hour format even when the user's profile is configured to use 12-hour (AM/PM) format.
# Expected: times should honour the profile's time format setting, matching the search results page.
# Fixed in: OBT Frontend

# ADO Test Case ID: 77129
@ado:77129
@regression @smoke @flights @bug:75337 @non-booking
Feature: 77129 OBT - Flight times should display in 12-hour format on the pricing page
  As a corporate traveler with a 12-hour time format profile setting
  I want flight times on the "Your Selection" pricing page to honour my time format preference
  So that the display is consistent with my profile and with the flight search results page

  @priority:high @tcid:77129
  Scenario: Flight times on the "Your Selection" page are displayed in 12-hour AM/PM format
    Given I am logged in as "ampm@format.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "LAX" to "SAN"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    Then flight times on the results page should be displayed in 12-hour AM/PM format
    When I select one flight segment by schedule
    And I wait for "Your Selection" text to be visible
    Then flight times on the pricing page should use the same format as the results page

