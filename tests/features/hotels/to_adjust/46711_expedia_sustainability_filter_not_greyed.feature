# Test Name: 46711 [Merge] Hotels - Sustainability filter is not greyed out and certification information is shown only once
# Description: 
# Status: Active
# Labels: Regression,Hotel,sustentability,Filters,certification,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-31T07:51:38Z
# Updated: 2025-06-20T12:34:15Z

@regression @provider:expedia
Feature: 46711 Expedia - Sustainability filter is not greyed out
  As a corporate traveler using Expedia
  I want to use the sustainability filter in hotel results
  So that I can find eco-friendly hotels

  @priority:medium
  Scenario: Sustainability filter is active and not greyed out in hotel results
    Given I am logged in as "expedia" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    # TODO: Create step "Then the sustainability filter should be enabled and not greyed out" that calls DSL verifySustainabilityFilterEnabled in HotelSearch.js
