# ADO Bug #85300 - Fusion - the same Vueling fare is listed twice on the pricing options panel
# Domain: Flights | Supplier: Fusion | Carrier: Vueling (VY)
# Route example: BRU → BCN round trip
# The same supplier fare was built twice, so it showed twice at the same price, once with baggage and once with N/A

@regression @flights @fusion @vueling @pricing-options @payload-validation @ado:85300 @ado:85871
Feature: 85871 Fusion - Vueling - Each fare listed once in pricing options
  As a corporate traveler booking a Vueling flight via Fusion
  I want each fare to appear only once in pricing options
  So that I am not shown the same fare twice

  Scenario: No Vueling fare is listed more times than Fusion returned it on either leg
    Given I am logged in as "veulingWeb@TFreg.club" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "BRU" to "BCN" with outbound in 10 days and return in 12 days
    Then flight results should be available
    When I filter airline results by "Vueling Airline" checkbox
    And I click to open first pricing options
    Then no fare in pricing options should be listed more times than Fusion returned it
    When I select the first option from pricing options
    Then no fare in pricing options should be listed more times than Fusion returned it
