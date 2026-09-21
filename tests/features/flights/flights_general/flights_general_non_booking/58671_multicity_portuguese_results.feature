# Test Name: 58671 Flights - Multicity - Portuguese - Results are displayed
# Status: Active
# Labels: Regression,Flights,multicity,portuguese,results,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-26T09:58:26Z
# Updated: 2025-09-14T10:36:01Z

@regression @flights @general @multi-city @portuguese
Feature: 58671 Flights - Multicity Portuguese results are displayed
  As a corporate traveler using the Portuguese interface
  I want to see multi-city flight results in Portuguese
  So that I can use the application in my preferred language

  Scenario: Multi-city results are displayed in Portuguese
    Given I am logged in as "aiva@amadeusportuguese.com" booking a new trip
    And the welcome heading should contain "Bem-vindo"
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "LON-MAD, MAD-ROM, ROM-LON"
    Then the "Adicionar à viagem" text should be visible in results