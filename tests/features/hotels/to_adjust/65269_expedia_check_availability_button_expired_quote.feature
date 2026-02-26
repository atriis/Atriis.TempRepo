# Test Name: 65269 hotel - check availability in expired quote
# Description: 
# Status: Active
# Labels: Hotel,Expedia,Regression,Expiry,Check price,Cart,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-08-03T01:28:36Z
# Updated: 2025-08-03T02:07:19Z

@regression @provider:expedia
Feature: 65269 Expedia - Check availability button shown on expired hotel quote
  As a corporate traveler with an expired hotel quote
  I want to see a "Check Availability" button on the expired quote
  So that I can re-check if the hotel is still available at updated pricing

  @priority:medium
  Scenario: Check availability button is shown when hotel quote has expired
    # TODO: Create step "Given I navigate to an existing expired Expedia hotel quote" that calls DSL navigateToExpiredQuote in Trip.js
    # TODO: Create step "Then the check availability button should be visible" that calls DSL verifyCheckAvailabilityButton in Cart.js
    # TODO: Create step "When I click the check availability button" that calls DSL clickCheckAvailability in Cart.js
