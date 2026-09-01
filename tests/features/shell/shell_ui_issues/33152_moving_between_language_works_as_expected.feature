# Test Name: 33152 Moving between language works as expected
# Description:
# Status: Active
# Labels: UI,Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-07-10T04:16:28Z
# Updated: 2023-07-11T08:48:17Z

@regression @shell @ui
Feature: 33152 - Moving between language works as expected
  As a corporate traveler
  I want to switch the application language from the support menu
  So that the interface, including the welcome message, is displayed in my selected language

  Scenario: Switching between Italian and English updates the welcome message
    Given I am logged in as "bsafkl@bsafkl.com" booking a new trip
    When I switch the application language to "Italian"
    Then the welcome heading should contain "Bentornato Bruna"
    When I switch the application language to "English (UK)"
    Then the welcome heading should contain "Welcome back Bruna"
