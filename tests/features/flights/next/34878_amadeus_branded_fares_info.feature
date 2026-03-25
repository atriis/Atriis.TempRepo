# Test Name: 34878 Amadeus branded info in results, pricing and cart
# Description:
# Status: Active
# Labels: Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: pini harush
# Created: 2023-08-20T02:23:04Z
# Updated: 2026-01-09T01:07:46Z

@regression @flights @amadeus @branded-fares
Feature: 34878 Amadeus - Branded fares info in results, pricing options, and cart
  As a corporate traveler
  I want to see branded fare information at every stage
  So that I know what ancillaries are included in my fare

  Scenario: Branded fare ancillaries are displayed in results, pricing options, and cart
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a random one way flight
    And I wait for add to trip text to be visible
    # TODO: Verify branded fares in Flight Details (results page)
    # Testim: clicks "Flight details" → clicks branded fares button →
    # verifies "The following ancillaries are included in this brand." text →
    # closes branded fares drawer → closes flight details
    # Existing steps: When I click to open flight details
    # Need new step: When I open branded fares from flight details
    # Then I should see ancillaries included in the brand
    # TODO: Verify branded fares in Pricing Options
    # Testim: clicks "Pricing Options" → opens flight details from pricing segment →
    # clicks branded fares → verifies ancillaries text → closes → checks brand name link →
    # reopens branded fares → closes all
    # Existing step: When I click to open first pricing options
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    # TODO: Verify branded fares in Cart (Flight Details drawer)
    # Testim: clicks "Flight details" in cart → clicks branded fares button →
    # verifies "The following ancillaries are included in this brand." →
    # closes drawers
    # Existing step: When I click more details in cart
