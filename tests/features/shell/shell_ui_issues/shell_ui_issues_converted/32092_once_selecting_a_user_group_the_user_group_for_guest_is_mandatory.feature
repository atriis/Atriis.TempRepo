# Test Name: 32092 Once selecting a user group, the user group for guest is mandatory
# Description:
# Status: Active
# Labels: Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-19T03:45:43Z
# Updated: 2026-02-17T06:46:34Z

@regression @shell @guest_traveler
Feature: 32092 - Once selecting a user group, the user group for guest is mandatory
  As a travel arranger
  I want the user group field to be mandatory when adding a guest traveler with "Users Group" settings
  So that a guest cannot be added without a valid user group when one is required

  @priority:medium
  Scenario: User group field is mandatory for a guest when "Users Group" settings are selected
    Given I am logged in as "testim@prof.com" booking a new trip
    When I open the add guest traveler form
    And I select "Users Group" as the copy settings for the guest
    And I fill in the guest details first name "Helena" last name "Glir" gender "Female" email "helena@glir.com"
    And I attempt to add the guest traveler
    Then the user group field should be marked as mandatory for the guest
