# Test Name: 66530 Trip opens in the same tab when user has 'Traveler' privileges
# Description:
# Status: Active
# Labels: traveler,Regression,Privileges,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-05T05:04:51Z
# Updated: 2025-10-28T02:01:52Z

@regression @shell @roles @privileges @trips
Feature: 66530 - Trip opens in the same tab when user has 'Traveler' privileges
  As a user with only the 'Traveler' privilege
  I want opening one of my trips to load it in the current browser tab
  So that I stay within the application instead of a new tab being spawned

  Scenario: A Traveler-privileged user opens an upcoming trip and it renders in the same tab
    Given I am logged in as "lurdesmacedo@traveler.com"
    When I navigate to the trips page
    And I select the "Upcoming trips" quick view on the trips page
    And I click the first trip from the trip list
    Then the trip should open in the same tab showing the trip overview page
