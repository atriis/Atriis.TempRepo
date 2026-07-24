# Test Name: 65552 Upcoming trips per persona
# Description:
# Status: Active
# Labels: Daily Shell,Regression,2026 plan 2
# Owner: Yael
# Created: 2025-08-14T10:58:47Z
# Updated: 2026-02-11T02:36:19Z

@regression @shell @homepage
Feature: 65552 - Upcoming trips per persona
  As a corporate traveler
  I want to see my upcoming trips on the homepage
  So that I can review the trips relevant to my persona

  Scenario: Opening the upcoming trips tab on the homepage
    Given I am logged in as "ruimariano@amadeus.com"
    Then I see the list of trips under my upcoming trips in homepage
