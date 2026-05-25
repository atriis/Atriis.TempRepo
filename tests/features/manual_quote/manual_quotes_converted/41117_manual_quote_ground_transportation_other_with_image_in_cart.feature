# Test Name: 41117 Manual Quote - Ground transportation, Other with image in cart
# Status: Active
# Labels: Manual Quote,No Amadeus Hotel Book,additional fees,Club,Cart,performance,Groundscope Regression,progress page,Transportation,2026 plan 1
# Owner: Noam Miller
# Created: 2024-01-15T05:42:31Z
# Updated: 2025-09-30T07:56:11Z
@regression @manual_quote @transportation @groundtransport
Feature: Manual Quote - Ground transportation and Other quote with image in cart
  As a corporate traveler
  I want to add a ground transport manual quote and an Other manual quote with handling fee
  So that they appear correctly in the cart and after checkout

  @priority:high
  Scenario: Add ground transport and Other manual quotes, validate cart and checkout
    Given I am logged in as "manualQuote@testim.com" booking a new trip
    And I have added myself as the traveler
    # TODO: New step + DSL — ManualQuoteSearch.addGroundTransportManualQuote(page, { from, to, supplier:'ACES TRANSPORTATION', comment:'no limitation', confirmation, base, tax })
    When I add a ground transport manual quote from "seattle" to "san juan island" with confirmation "SJ-90885" base "29" tax "13.50"
    # TODO: New step + DSL — ManualQuoteCart.expectGroundTransportInfo(page, text) (.extra-info p == 'Pay On Departure')
    Then the ground transport manual quote in cart should show "Pay On Departure"
    # TODO: New step + DSL — ManualQuoteSearch.addOtherManualQuote(page, { type:'Handling Fee', amount, dates:nextMonth })
    When I add an Other manual quote of type Handling Fee with amount "15"
    # TODO: New step + DSL — Cart.expectTitleText(page, 'Proceed to Checkout')
    Then the cart should display "Proceed to Checkout"
    # TODO: New step + DSL — ManualQuoteCart.expectOtherQuoteCardVisible(page)
    And the Other manual quote card should be visible in the cart
    # TODO: New step + DSL — ManualQuoteCart.expectOtherQuoteDetailText(page, text) ('TypeHandlingFee' row)
    And the Other manual quote details should show "TypeHandlingFee"
    # TODO: New step + DSL — ManualQuoteCart.expectOtherQuoteIcon(page) (document/material-symbols icon on last Other quote card)
    And the Other manual quote should display the document icon
    # TODO: New step + DSL — ManualQuoteCart.expectOtherQuoteAmount(page, amount) (.other-products-quote-card .amount)
    And the Other manual quote amount should be "$15.00"
    # TODO: New step + DSL — ManualQuoteCart.openGroundTransportDetails(page) (click .more-details on ground transport quote card)
    When I open the ground transport more details panel
    # TODO: New step + DSL — ManualQuoteCart.expectGroundTransportDetails(page, { supplier, pickup, dropoff, subtotalContains })
    Then the ground transport details should show supplier "ACES TRANSPORTATION" pickup "seattle, wa, usa" dropoff "san juan island, washington, usa" subtotal containing "42.50"
    When I proceed to checkout
    # TODO: New step + DSL — Cart.expectSummaryTitle(page, 'Handling Fee') (.summary-title)
    Then the cart summary should display "Handling Fee"
    When I complete the booking
    # TODO: New step + DSL — Trips.expectTripOverviewSupplier(page, supplier) (.el-tabs h5 contains supplier)
    Then the trip overview should show ground transport supplier "ACES TRANSPORTATION"
    # TODO: Reuses ManualQuoteCart.expectOtherQuoteDetailText after checkout
    And the Other manual quote details should show "TypeHandlingFee"
    # TODO: New step + DSL — extend ManualQuoteCart.expectOtherQuoteAmount with regex/contains support
    And the Other manual quote amount should contain "15.00"
    # TODO: New step + DSL — ManualQuoteCart.expectGroundTransportAmount(page, regex)
    And the ground transport amount should contain "42.50"
    Then I successfully cancel the trip
