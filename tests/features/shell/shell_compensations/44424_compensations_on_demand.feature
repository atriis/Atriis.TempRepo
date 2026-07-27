# Test Name: 44424 Compensations on demand
# Description: carbon calculation is correct according to all the items in the cart - not relevant now because we don't get results from the supplier
# Status: Active
# Labels: Regression,Cart,Approval flow,Amadeus,Flights,Compensation,Full Purchase,Manual Quote,2026 plan 1
# Owner: pini harush
# Created: 2024-04-04T01:53:03Z
# Updated: 2025-07-28T10:24:16Z
#
# SCOPE NOTE: the Testim source guards its tail behind
# removed_until_we_wil_get_results_from_co2_supplier(), which begins `if (true) { return; }`.
# That disabled block — add a ground-service manual quote, check out, validate
# flight + ground service + compensation against the total with a tolerance of 2, then
# cancel the trip — is NOT converted here, per the Phase 0 scope decision. Restore it from
# the Testim source once the CO2 supplier returns results.

@regression @shell @compensation @flights @provider:amadeus
Feature: 44424 Amadeus - Compensations on demand
  As a corporate traveler whose company offers climate compensation on demand
  I want to add a Climate Contribution to my trip myself from the cart's additional items
  So that I can offset my flight even when the compensation is not added automatically

  Scenario: Add a climate contribution on demand from the cart and review its terms
    Given I am logged in as "On@demand.comp" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "BOS"
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    Then the additional items section should be displayed in cart
    When I add the climate contribution from the additional items section
    Then the "Climate Contribution" compensation quote should be displayed in cart
    When I open the compensation terms and conditions
    Then the compensation terms should state that the purchase is non-refundable