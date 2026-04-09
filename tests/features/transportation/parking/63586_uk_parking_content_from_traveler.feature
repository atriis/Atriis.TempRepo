# Test Name: 63586 UK Parking - Content is taking from traveler
# Description:
# Status: Active
# Labels: UK Parking,Regression,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-06-19T07:30:41Z
# Updated: 2025-12-10T12:05:11Z

@regression @transportation @parking
Feature: 63586 UK Parking - Parking results are filtered based on the primary traveler

  As a corporate travel manager
  I want parking results to reflect the primary traveler's entitlements
  So that only eligible parking options are shown for the traveler

  Scenario: No parking results found when a non-entitled guest is set as primary traveler
    Given I am logged in as "parking" booking a new trip
    And I have added myself as the traveler
    When I search for UK parking at "LHR"
    And I wait for add to trip text to be visible
    # TODO: map inline page.click("body > :nth-child(2) ul > li:nth-of-type(1) a") - click first item in navigation menu (purpose unclear from Testim source)
    When I add a guest with user group as primary traveler
    Then no results should be found for UK parking
