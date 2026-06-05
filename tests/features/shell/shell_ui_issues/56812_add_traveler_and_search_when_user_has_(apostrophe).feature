# Test Name: 56812 Add traveler and search when user has ' (apostrophe)
# Description:
# Status: Active
# Labels: search,traveler,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-16T12:26:50Z
# Updated: 2025-08-04T09:51:23Z

@regression @shell @flights @search @traveler
Feature: 56812 - Add traveler and search when user has ' (apostrophe)
  As a corporate travel booker
  I want to be able to add a traveler whose name contains an apostrophe and perform a flight search
  So that users with names like "O'Donovan" are not blocked from being selected as travelers

  Scenario: Add traveler with apostrophe in name and search for a one-way flight
    Given I am logged in as "andreiao'donovan@aaatestim.com" booking a new trip
    And I have added traveler by name "O'Donovan"
    When I search for a one way flight from "LON" to "MAD"
    And I wait for add to trip text to be visible
