# Test Name: 18420 Expedia Member Rates - Price with discount is lower than total price
# Description: 
# Status: Active
# Labels: Expedia,Regression,Hotel,price,Check price,Daily Hotels,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-12-31T06:37:59Z
# Updated: 2025-10-22T04:02:36Z

@regression @provider:expedia
Feature: 18420 Expedia - Member rates are displayed
  As a corporate traveler using Expedia
  I want to see member rates for hotels
  So that I can take advantage of discounted pricing

  @priority:high
  Scenario: Member rates are visible in hotel and room level results
    Given I am logged in as "expedia" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Verona, Italy" for 1 night
    # TODO: Create step "Then I should see member rates displayed in hotel level results" that calls a DSL method in HotelSearch.js
    # TODO: Create step "When I select the first hotel result" - check if available or create DSL method verifyMemberRatesInHotelLevel
    # TODO: Create step "Then I should see member rates displayed in room level results" that calls DSL method verifyMemberRatesInRoomLevel
    # TODO: Create step "Then the member rate price should be lower than the regular price" that calls DSL method compareDiscountVsRegularPrice
