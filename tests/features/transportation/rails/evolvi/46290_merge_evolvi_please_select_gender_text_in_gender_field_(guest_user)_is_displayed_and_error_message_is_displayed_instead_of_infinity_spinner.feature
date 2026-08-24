# Test Name: 46290 [Merge] Evolvi - "Please select gender" text in gender field (guest user) is displayed and error message is displayed instead of infinity spinner
# Description:
# Status: Active
# Labels: Regression,merge,guest,Rail,Evolvi,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-22T09:33:42Z
# Updated: 2025-09-14T09:14:20Z
@transportation @rails @evolvi @regression
Feature: 46290 Evolvi - Guest gender prompt and no results error display
  As a corporate traveler
  I want to add a guest in Evolvi search
  So that gender prompt appears and the flow returns a user-friendly no-results message

  Scenario: Guest traveler shows gender prompt and no-results messaging
    Given I am logged in as "corp@evolvi.com" booking a new trip
    When I select UK Rail in the search form
    When I open the add guest traveler form
    Then the gender field placeholder should display "Please select gender"
    When I close the guest traveler dialog
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "licToLic"
    And I acknowledge the push notification
    Then the no results found message should be displayed
