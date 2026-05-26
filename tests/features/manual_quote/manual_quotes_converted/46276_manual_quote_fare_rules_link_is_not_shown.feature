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

    # Testim shared step: Add_Manual_Quote_Flight_One_Way_LON_MAD()
    # TODO: Reuses ManualQuoteSearch.openManualQuotePage
    When I open the Manual Quote tab
    # TODO: Reuses ManualQuoteSearch.expectHeading (waitForText '.flight-number' == 'Flight 1')
    Then the flight manual quote form should display "Flight 1"
    # TODO: Reuses ManualQuoteSearch.fillFlightOrigin
    When I enter "LON" as the flight manual quote origin
    # TODO: Reuses ManualQuoteSearch.fillFlightDestination
    And I enter "MAD" as the flight manual quote destination
    # TODO: Reuses ManualQuoteSearch.pickFlightDepartureNextMonth
    And I pick a future departure date for the flight manual quote
    # TODO: Reuses ManualQuoteSearch.fillFlightNumber
    And I set the flight number to "1235"
    # TODO: Reuses ManualQuoteSearch.fillFlightBookingRef
    And I set the flight booking reference to "rewq23"
    # TODO: Reuses ManualQuoteSearch.fillFlightCarrier
    And I set the flight carrier to "el al"
    # TODO: Reuses ManualQuoteSearch.selectFirstCarrierSuggestion
    And I select the first carrier suggestion
    # TODO: Reuses ManualQuoteSearch.fillFlightBaseFare
    And I set the flight base fare to "1"
    # TODO: Reuses ManualQuoteSearch.fillFlightTax
    And I set the flight tax to "20"
    # TODO: Reuses ManualQuoteSearch.fillFlightChangeFee
    And I set the flight change fee to "5"
    # TODO: Reuses ManualQuoteSearch.saveQuote
    And I save the flight manual quote

    # Testim shared step: On_Hold___Wait_for_element_text()
    # TODO: New step + DSL — ManualQuoteCart.expectQuoteLabel(page, 'On hold') ('.app-label--quote')
    Then the booking status should be "On hold"

    # Testim shared step: __Fare_Rules__link_is_not_shown()
    # TODO: New step + DSL — ManualQuoteCart.scrollCartTo(page, 318)
    When I scroll the cart to the flight manual quote section
    # TODO: Reuses ManualQuoteCart.openFlightDetailsDrawer (click '.more-details-btn')
    And I open the flight manual quote details drawer
    # TODO: New step + DSL — ManualQuoteCart.expectFareRulesLinkAbsent(page, 'details') (negative-element-validation marker)
    Then the Fare Rules link should not be visible in the flight manual quote details
    # TODO: New step + DSL — ManualQuoteCart.closeDrawerHeader(page) (click '#el-drawer__title > button > i')
    When I close the flight manual quote details drawer
    # TODO: Reuses ManualQuoteCart.openFlightPriceBreakdown (click '.price-breakdown-btn')
    And I open the flight manual quote price breakdown
    # TODO: Reuses ManualQuoteCart.expectFareRulesLinkAbsent(page, 'breakdown')
    Then the Fare Rules link should not be visible in the flight manual quote price breakdown
    # TODO: Reuses ManualQuoteCart.closeDrawerHeader
    When I close the flight manual quote price breakdown

    Then I successfully cancel the trip
