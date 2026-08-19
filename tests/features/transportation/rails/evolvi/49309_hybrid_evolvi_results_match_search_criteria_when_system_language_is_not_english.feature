# Test Name: HYBRID for 49309 Evolvi - Results match search criteria when system language is not English
# Description:
# Status: Active
# Labels: hybrid,Regression,results,Rail,Evolvi,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2024-08-01T12:06:51Z
# Updated: 2025-10-30T12:36:22Z
@transportation @rails @evolvi @regression @hybrid
Feature: 49309 HYBRID Evolvi - Results match search criteria when system language is not English
  As a corporate traveler
  I want to repeat an Evolvi UK Rail round trip search after switching the system language away from English
  So that the results still match the search criteria when the application is not in English

  Scenario: Evolvi - Results match search criteria when system language is not English
    Given I am logged in as "thiagosantos@evolvi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Evolvi train from "bthToPad"
    And I dismiss the mandatory notifications popup if displayed
    Then I should see the heading "Outbound"
    When I go back to the homepage
    And I switch the application language to "German"
    Then the welcome heading should contain "Willkommen zurück"
    When I search for a round trip Evolvi train from "bthToPad"
    Then I should see the heading "Hinreise"
    When I switch the application language to "English"
    Then the welcome heading should contain "Welcome back"
