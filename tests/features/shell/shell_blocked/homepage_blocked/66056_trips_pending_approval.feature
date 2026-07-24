# Test Name: 66056 Trips pending approval
# Description:
# Status: Active
# Labels: Daily Shell,Regression,2026 plan 2
# Owner: Yael
# Created: 2025-08-26T06:49:19Z
# Updated: 2025-09-21T02:53:06Z

@regression @shell @homepage
Feature: 66056 - Trips pending approval
  As a corporate traveler
  I want to open the trips pending approval view from the homepage
  So that I can track the trips awaiting an approval decision

  Scenario: Opening the trips pending approval tab from the homepage
    Given I am logged in as "uri@e.com"
    # TODO: implement 'I open the upcoming trips tab' — click the upcoming-trips tab header on the homepage
    When I open the upcoming trips tab
    # TODO: implement 'I open the trips pending approval tab' — click the pending-approval button in the trip tabs container
    And I open the trips pending approval tab
