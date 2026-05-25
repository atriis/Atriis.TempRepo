# Test Name: 46276 Manual quote - "Fare Rules" link is not shown
# Status: Active
# Labels: Regression,Manual Quote,Fare Rules,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-22T07:58:13Z
# Updated: 2025-10-21T11:40:32Z
@regression @manual_quote @flights
Feature: Manual Quote - Fare Rules link is not shown for flight manual quotes
  As a corporate traveler
  I want manual flight quotes to omit the Fare Rules link
  So that I am not led to fare information that does not apply to manual quotes

  @priority:medium
  Scenario: Flight manual quote does not show a Fare Rules link in details or price breakdown
    Given I am logged in as "camilacoelho@manualquotetravelpolicy.com" booking a new trip
    And I have added myself as the traveler
    # TODO: Reuses ManualQuoteSearch.addOneWayFlightManualQuote (also used in 35770/41113/47193)
    When I add a one-way flight manual quote from "LON" to "MAD"
    Then the booking status should be "On hold"
    # TODO: New step + DSL — ManualQuoteCart.openFlightDetailsDrawer(page) (click .more-details-btn on flight manual quote)
    When I open the flight manual quote more details panel
    # TODO: New step + DSL — ManualQuoteCart.expectNoFareRulesLink(page, 'details') (negative assertion)
    Then the Fare Rules link should not be visible in the flight manual quote details
    # TODO: New step + DSL — ManualQuoteCart.closeFlightDetailsDrawer(page) (#el-drawer__title close button)
    When I close the flight manual quote more details panel
    # TODO: New step + DSL — ManualQuoteCart.openFlightPriceBreakdown(page) (click .price-breakdown-btn)
    And I open the flight manual quote price breakdown panel
    # TODO: Reuses ManualQuoteCart.expectNoFareRulesLink(page, 'breakdown')
    Then the Fare Rules link should not be visible in the flight manual quote price breakdown
    # TODO: New step + DSL — ManualQuoteCart.closeFlightPriceBreakdown(page)
    When I close the flight manual quote price breakdown panel
    Then I successfully cancel the trip
