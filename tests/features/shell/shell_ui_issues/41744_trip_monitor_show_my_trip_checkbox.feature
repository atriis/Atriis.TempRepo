# Test Name: 41744 Trip monitor- show "my trip" checkbox
# Description:
# Status: Active
# Labels: Trip monitor,Regression,Sanity,Pre Prod,Daily Shell,2026 plan 1
# Owner: pini harush
# Created: 2024-01-29T03:28:55Z
# Updated: 2024-01-29T03:33:13Z

@regression @shell @trips
Feature: 41744 - Trip monitor show "my trip" checkbox
  As a corporate traveler
  I want to navigate to the trips monitor page
  So that the "My trips only" filter checkbox is displayed in the trips filter panel

  Scenario: My trips only checkbox is visible on the trips monitor page
    Given I am logged in as "approval@flow.com"
    When I navigate to the trips page
    Then the "My trips only" filter checkbox should be visible on the trips page
