# Test Name: 37162 The profile management component opens on Personal Details tab
# Description:
# Status: Active
# Labels: UI,Regression,Profile,never failed,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-10-18T09:08:43Z
# Updated: 2025-07-14T07:28:55Z

@regression @shell @profile
Feature: 37162 - The profile management component opens on Personal Details tab
  As a corporate traveler
  I want the profile management component to open directly on the Personal Details tab
  So that I can immediately view and edit my personal information without extra navigation

  @priority:medium
  Scenario: Profile management component opens on Personal Details tab when clicking the traveler name
    Given I am logged in as "testim@prof.com" booking a new trip
    And I have added myself as the traveler
    When I open the traveler profile from the traveler name
    # TODO: Then the Personal Details tab should be active showing the "Title" field label — Profile.verifyPersonalDetailsTabActive(page) / assert label ".name-inputs-container > :nth-child(1) .label" contains "Title"
