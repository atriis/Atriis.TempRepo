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

    # Testim shared step: Add_manual_quote___Ground_transport()
    # TODO: Reuses ManualQuoteSearch.openManualQuotePage (click '.is-capitalized')
    When I open the Manual Quote tab
    # TODO: New step + DSL — ManualQuoteSearchPage.clickGroundServiceTab(page) (click '#tab-groundService p')
    And I open the Manual Quote - Ground Service tab
    # TODO: New step + DSL — ManualQuoteSearch.expectFormLabel(page, 'Comment')
    Then the ground transport form should display the "Comment" label
    # TODO: New step + DSL — ManualQuoteSearch.fillGroundPickupCity(page, name) (autocomplete — 'seattle')
    When I set the ground transport pickup city to "seattle"
    # TODO: New step + DSL — ManualQuoteSearch.pickFirstGroundPickupSuggestion(page)
    And I pick the first ground transport pickup suggestion
    # TODO: New step + DSL — ManualQuoteSearch.fillGroundDropoffCity(page, name) ('san juan island')
    And I set the ground transport dropoff city to "san juan island"
    # TODO: New step + DSL — ManualQuoteSearch.pickFirstGroundDropoffSuggestion(page)
    And I pick the first ground transport dropoff suggestion
    # TODO: New step + DSL — ManualQuoteSearch.pickGroundPickupNextMonth(page) (date-generator — next month, 4th row 5th col)
    And I pick a future ground transport pickup date
    # TODO: New step + DSL — ManualQuoteSearch.pickGroundPickupTime(page) (open hour dropdown + select first option)
    And I pick a ground transport pickup time
    # TODO: New step + DSL — ManualQuoteSearch.fillGroundComment(page, text)
    And I set the ground transport comment to "no limitation"
    # TODO: New step + DSL — ManualQuoteSearch.selectGroundSupplier(page, supplier) (open '.manual-select' + pick 'ACES TRANSPORTATION')
    And I select the ground transport supplier "ACES TRANSPORTATION"
    # TODO: New step + DSL — ManualQuoteSearch.selectGroundPassengerType(page) (open '.is-danger' caret + pick first option)
    And I select the first ground transport passenger type
    # TODO: New step + DSL — ManualQuoteSearch.fillGroundPhoneCountry(page, value) ('#el-id-2150-373' — '123')
    And I set the ground transport phone country code to "123"
    # TODO: New step + DSL — ManualQuoteSearch.fillGroundPhoneArea(page, value) ('#el-id-2150-374' — '45')
    And I set the ground transport phone area code to "45"
    # TODO: New step + DSL — ManualQuoteSearch.fillGroundPhoneNumber(page, value) ('#el-id-2150-375' — '678')
    And I set the ground transport phone number to "678"
    # TODO: New step + DSL — ManualQuoteSearch.fillGroundConfirmation(page, value)
    And I set the ground transport confirmation number to "SJ-90885"
    # TODO: New step + DSL — ManualQuoteSearch.fillGroundBase(page, amount)
    And I set the ground transport base price to "29"
    # TODO: New step + DSL — ManualQuoteSearch.fillGroundTax(page, amount)
    And I set the ground transport tax to "13.50"
    # TODO: Reuses ManualQuoteSearch.saveQuote
    And I save the ground transport manual quote
    # TODO: New step + DSL — ManualQuoteCart.expectGroundTransportInfo(page, text) (.extra-info p == 'Pay On Departure')
    Then the ground transport manual quote should show "Pay On Departure"

    # Testim shared step: Add_manual_quote___Other()
    When I open the Manual Quote tab
    # TODO: New step + DSL — ManualQuoteSearchPage.clickOtherProductsTab(page) (click '#tab-manualOtherProducts')
    And I open the Manual Quote - Other sub-tab
    Then the Other quote form should display the "Comment" label
    # TODO: New step + DSL — ManualQuoteSearch.selectOtherQuoteType(page, type) (open caret + pick 'Handling Fee')
    When I select the Other quote type "Handling Fee"
    # TODO: New step + DSL — ManualQuoteSearch.pickOtherFromDateNextMonth(page) (date-generator)
    And I pick a future "from" date for the Other quote
    # TODO: New step + DSL — ManualQuoteSearch.pickOtherToDateNextMonth(page) (date-generator)
    And I pick a future "to" date for the Other quote
    # TODO: Reuses ManualQuoteSearch.fillPerDiemAmount (same input)
    And I enter the Other quote amount "15"
    # TODO: Reuses ManualQuoteSearch.saveQuote
    And I save the Other manual quote
    # TODO: Reuses Cart.expectButtonText (waitForText '.btn-container span' 'Proceed to Checkout')
    Then the cart should display the "Proceed to Checkout" button
    # TODO: New step + DSL — ManualQuoteCart.scrollCartTo(page, 439)
    When I scroll the cart down to the Other quote section
    # TODO: New step + DSL — ManualQuoteCart.expectOtherQuoteCardVisible(page) ('.other-products-quote-card .box-card-container')
    Then the Other manual quote card should be visible in the cart
    # TODO: New step + DSL — ManualQuoteCart.expectOtherQuoteDetailText(page, 'TypeHandlingFee')
    And the Other manual quote details should show "TypeHandlingFee"
    # TODO: New step + DSL — ManualQuoteCart.expectOtherQuoteIcon(page) ('.last .material-symbols-outlined')
    And the Other manual quote should display the document icon
    # TODO: New step + DSL — ManualQuoteCart.expectOtherQuoteAmount(page, '$15.00')
    And the Other manual quote amount should be "$15.00"

    # Testim shared step: Ground_transport___more_details__terms___conditions()
    # TODO: New step + DSL — ManualQuoteCart.openGroundTransportDetails(page) (click '.more-details')
    When I open the ground transport more details panel
    # TODO: New step + DSL — ManualQuoteCart.expectGroundTransportSupplier(page, 'ACES TRANSPORTATION')
    Then the ground transport details should show supplier "ACES TRANSPORTATION"
    # TODO: New step + DSL — ManualQuoteCart.expectGroundTransportPickup(page, 'seattle, wa, usa')
    And the ground transport pickup should be "seattle, wa, usa"
    # TODO: New step + DSL — ManualQuoteCart.expectGroundTransportDropoff(page, 'san juan island, washington, usa')
    And the ground transport dropoff should be "san juan island, washington, usa"
    # TODO: New step + DSL — ManualQuoteCart.expectGroundTransportSubtotal(page, /42.50/)
    And the ground transport subtotal should contain "42.50"
    # TODO: New step + DSL — ManualQuoteCart.closeGroundTransportDetails(page)
    When I close the ground transport more details panel

    # Testim shared step: Checkout_to_complete_booking() -> book_and_finalize() -> Click_Go_to_Trip()
    When I proceed to checkout
    # TODO: New step + DSL — Cart.expectSummaryTitle(page, 'Handling Fee')
    Then the checkout summary should display "Handling Fee"
    # TODO: New step + DSL — Checkout.expectBookingDetailsHeading(page) (waitForText 'Booking details')
    And the checkout page should display "Booking details"
    # TODO: Reuses Checkout.bookAndFinalize (clicks '[class^=btn--width]' then 'Go to trip')
    When I complete the booking
    # TODO: New step + DSL — Trips.expectGoToTripButton(page) (waitForText 'Go to trip')
    Then a "Go to trip" button should be displayed
    When I click Go to Trip
    # TODO: New step + DSL — Trips.expectTripOverviewTitle(page, 'Trip overview')
    Then the trip overview should display "Trip overview"
    # TODO: New step + DSL — Trips.expectTripOverviewSupplier(page, 'ACES TRANSPORTATION') (.el-tabs h5)
    And the trip overview should show ground transport supplier "ACES TRANSPORTATION"

    # Testim shared step: Validate_info_after_checkout()
    # TODO: Reuses ManualQuoteCart.expectOtherQuoteDetailText
    Then the Other manual quote details should show "TypeHandlingFee"
    # TODO: Reuses ManualQuoteCart.expectOtherQuoteAmount (with regex)
    And the Other manual quote amount should contain "15.00"
    # TODO: New step + DSL — Trips.expectGroundTransportOverviewAmount(page, /42.50/) ('#pane-overview .amount')
    And the ground transport amount should contain "42.50"

    Then I successfully cancel the trip
