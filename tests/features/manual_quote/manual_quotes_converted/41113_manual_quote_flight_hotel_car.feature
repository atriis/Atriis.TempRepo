# Test Name: 41113 (merged) Manual Quote - flight, hotel, car
# Status: Active
# Labels: Manual Quote,Regression,Fare Rules,No Amadeus Hotel Book,Club,Flights,Cars,Hotel,Pre Prod,merge,Giata,2026 plan 1
# Owner: Noam Miller
# Created: 2024-01-10T12:55:45Z
# Updated: 2025-10-27T09:35:50Z
@regression @manual_quote
Feature: Manual Quote - Flight, Hotel and Car manual quotes in one trip
  As a corporate traveler
  I want to add flight, hotel and car manual quotes in a single trip and complete booking
  So that I can manage mixed manual-quote trips end to end

  @priority:critical
  Scenario: Add flight, hotel and car manual quotes, validate cart, checkout and cancel
    Given I am logged in as "manualQuote@testim.com" booking a new trip
    And I have added myself as the traveler

    # Testim shared step: add_manual_quote_flight_one_way_LON_MAD()
    # TODO: New step + DSL — ManualQuoteSearch.openManualQuotePage(page) (click '.is-capitalized')
    When I open the Manual Quote tab
    # TODO: New step + DSL — ManualQuoteSearch.expectHeading(page, 'Flight 1') (waitForText on '.flight-number')
    Then the flight manual quote form should display "Flight 1"
    # TODO: New step + DSL — ManualQuoteSearch.fillFlightOrigin(page, code) (#el-id-1095-4118)
    When I enter "LON" as the flight manual quote origin
    # TODO: New step + DSL — ManualQuoteSearch.fillFlightDestination(page, code)
    And I enter "MAD" as the flight manual quote destination
    # TODO: New step + DSL — ManualQuoteSearch.pickFlightDepartureNextMonth(page) ('date-generator' marker — DSL picks 4th-row 4th-col of next month)
    And I pick a future departure date for the flight manual quote
    # TODO: New step + DSL — ManualQuoteSearch.fillFlightNumber(page, flightNumber) (input '#el-id-1095-4128' — '1235')
    And I set the flight number to "1235"
    # TODO: New step + DSL — ManualQuoteSearch.fillFlightBookingRef(page, ref) (input '#el-id-1095-4132' — 'rewq23')
    And I set the flight booking reference to "rewq23"
    # TODO: New step + DSL — ManualQuoteSearch.fillFlightCarrier(page, carrier) (input '#el-id-1095-4133' — 'el al')
    And I set the flight carrier to "el al"
    # TODO: New step + DSL — ManualQuoteSearch.selectFirstCarrierSuggestion(page) (click '#el-id-1095-3779 > span')
    And I select the first carrier suggestion
    # TODO: New step + DSL — ManualQuoteSearch.fillFlightBaseFare(page, amount) ('#el-id-1095-3378' — '1')
    And I set the flight base fare to "1"
    # TODO: New step + DSL — ManualQuoteSearch.fillFlightTax(page, amount) ([name='tax'] — '20')
    And I set the flight tax to "20"
    # TODO: New step + DSL — ManualQuoteSearch.fillFlightChangeFee(page, amount) ('#el-id-1077-2584' — '5')
    And I set the flight change fee to "5"
    # TODO: New step + DSL — ManualQuoteSearch.saveQuote(page) (click '.add-quote-btn')
    And I save the flight manual quote
    # TODO: New step + DSL — Cart.expectTitleText(page, 'Trip overview') (waitForText '.payments-title')
    Then the cart should display "Trip overview"

    # Testim shared step: Add_hotel_manual_quote()
    # TODO: New step + DSL — ManualQuoteSearch.openManualQuotePage(page)
    When I open the Manual Quote tab
    # TODO: New step + DSL — ManualQuoteSearchPage.clickHotelTab(page) (click '#tab-hotel p')
    And I open the Manual Quote - Hotel tab
    # TODO: New step + DSL — ManualQuoteSearch.searchHotelByLocation(page, query) (placeholder 'Search by hotel name…' — 'PDX')
    And I search for a hotel by location "PDX"
    # TODO: New step + DSL — ManualQuoteSearch.pickFirstHotelSuggestion(page)
    And I pick the first hotel suggestion
    # TODO: New step + DSL — ManualQuoteSearch.submitHotelSearch(page) (click '.search-hotel-btn')
    And I submit the hotel manual quote search
    # TODO: New step + DSL — ManualQuoteSearch.expectHotelChooseAvailable(page) (waitForText 'Choose' on first result)
    Then a hotel result with a "Choose" button should be available
    # TODO: New step + DSL — ManualQuoteSearch.chooseHotelAtIndex(page, index) (click 3rd hotel-results .btn)
    When I choose the 3rd hotel result
    # TODO: New step + DSL — ManualQuoteSearch.fillHotelCity(page, city) (placeholder 'City' — 'Portland')
    And I set the hotel city to "Portland"
    # TODO: New step + DSL — ManualQuoteSearch.pickFirstCitySuggestion(page) (autocomplete 5312-item-0)
    And I pick the first city suggestion
    # TODO: New step + DSL — ManualQuoteSearch.pickHotelCheckInNextMonth(page) (date-generator)
    And I pick a future check-in date for the hotel manual quote
    # TODO: New step + DSL — ManualQuoteSearch.pickHotelCheckOutNextMonth(page) (date-generator)
    And I pick a future check-out date for the hotel manual quote
    # TODO: New step + DSL — ManualQuoteSearch.selectHotelCancellation(page, label) (open caret + pick 5th option '48HRS Prior to Arrival')
    And I select the hotel cancellation policy "48HRS Prior to Arrival"
    # TODO: New step + DSL — ManualQuoteSearch.fillHotelConfirmation(page, number)
    And I set the hotel confirmation number to "34478316577"
    # TODO: New step + DSL — ManualQuoteSearch.fillHotelRoomDescription(page, text)
    And I set the hotel room description to "standard double"
    # TODO: New step + DSL — ManualQuoteSearch.fillHotelBase(page, amount)
    And I set the hotel base price to "78"
    # TODO: New step + DSL — ManualQuoteSearch.fillHotelTax(page, amount)
    And I set the hotel tax to "36"
    # TODO: Reuses ManualQuoteSearch.saveQuote
    And I save the hotel manual quote
    # TODO: New step + DSL — Cart.expectButtonText(page, 'Proceed to Checkout') (waitForText '.btn-container span')
    Then the cart should display the "Proceed to Checkout" button
    Then the cart should display "Trip overview"

    # Testim shared step: Add_car_manual_quote()
    When I open the Manual Quote tab
    # TODO: New step + DSL — ManualQuoteSearch.expectFlightQuoteSectionHeading(page, 'Flight manual quote')
    Then the cart should still show the "Flight manual quote" section
    # TODO: New step + DSL — ManualQuoteSearchPage.clickCarTab(page) (click '#tab-car p')
    When I open the Manual Quote - Car tab
    # TODO: New step + DSL — ManualQuoteSearch.fillCarPickupAirport(page, code) ('PDX')
    And I set the car pickup airport to "PDX"
    # TODO: New step + DSL — ManualQuoteSearch.fillCarPickupCity(page, name) ('portland')
    And I set the car pickup city to "portland"
    # TODO: New step + DSL — ManualQuoteSearch.fillCarDropoffAirport(page, code) ('SFO')
    And I set the car dropoff airport to "SFO"
    # TODO: New step + DSL — ManualQuoteSearch.fillCarDropoffCity(page, name) ('san francisco')
    And I set the car dropoff city to "san francisco"
    # TODO: New step + DSL — ManualQuoteSearch.pickCarPickupNextMonth(page) (date-generator)
    And I pick a future car pickup date
    # TODO: New step + DSL — ManualQuoteSearch.pickCarDropoffNextMonth(page) (date-generator)
    And I pick a future car dropoff date
    # TODO: New step + DSL — ManualQuoteSearch.fillCarSupplier(page, supplier) ('avis')
    And I set the car supplier to "avis"
    # TODO: New step + DSL — ManualQuoteSearch.fillCarMileage(page, text) ('no limitation')
    And I set the car mileage policy to "no limitation"
    # TODO: New step + DSL — ManualQuoteSearch.fillCarConfirmation(page, value)
    And I set the car confirmation number to "966231A"
    # TODO: New step + DSL — ManualQuoteSearch.fillCarBase(page, amount)
    And I set the car base price to "60"
    # TODO: New step + DSL — ManualQuoteSearch.fillCarTax(page, amount)
    And I set the car tax to "24"
    # TODO: Reuses ManualQuoteSearch.saveQuote
    And I save the car manual quote
    Then the cart should display the "Proceed to Checkout" button

    # Testim shared step: Validate_quote_info_in_cart() -> Car()
    # TODO: New step + DSL — ManualQuoteCart.openCarDetailsDrawer(page) (click '.car-quote-card .more-details')
    When I open the car manual quote details drawer
    # TODO: New step + DSL — ManualQuoteCart.expectCarCancellationPolicyLabel(page) (waitForText 'Cancellation policy')
    Then the car details should show the "Cancellation policy" section
    # TODO: New step + DSL — ManualQuoteCart.expectCarConfirmationNumber(page, value)
    And the car details should show "Confirmation Number:966231A"
    # TODO: New step + DSL — ManualQuoteCart.expectCarPickup(page, value)
    And the car pickup should be "portland,or,usa,(pdx)"
    # TODO: New step + DSL — ManualQuoteCart.expectCarDropoff(page, value)
    And the car dropoff should be "san francisco,ca,usa,(sfo)"
    # TODO: New step + DSL — ManualQuoteCart.expectCarSubtotal(page, value)
    And the car subtotal should be "$84.00"
    # TODO: New step + DSL — ManualQuoteCart.closeCarDetailsDrawer(page)
    When I close the car manual quote details drawer
    # TODO: New step + DSL — ManualQuoteCart.openCarMileageDialog(page) (click '.py*' on car card)
    And I open the car mileage dialog
    # TODO: New step + DSL — ManualQuoteCart.expectCarMileageText(page, 'no limitation')
    Then the car mileage dialog should show "no limitation"
    # TODO: New step + DSL — ManualQuoteCart.closeCarMileageDialog(page)
    When I close the car mileage dialog

    # Testim shared step: Validate_quote_info_in_cart() -> Flight()
    # TODO: New step + DSL — ManualQuoteCart.openFlightDetailsDrawer(page) (click '.more-details-btn')
    When I open the flight manual quote details drawer
    # TODO: New step + DSL — ManualQuoteCart.expectFlightCarrier(page, 'EL AL')
    Then the flight carrier should be "EL AL"
    # TODO: New step + DSL — ManualQuoteCart.expectFlightOrigin(page, 'LON')
    And the flight origin should be "LON"
    # TODO: New step + DSL — ManualQuoteCart.expectFlightDestination(page, 'MAD')
    And the flight destination should be "MAD"
    # TODO: New step + DSL — ManualQuoteCart.expectFlightNumber(page, 'LY1235')
    And the flight number should be "LY1235"
    # TODO: New step + DSL — ManualQuoteCart.expectFlightAmount(page, '$26.00')
    And the flight amount should be "$26.00"
    # TODO: New step + DSL — ManualQuoteCart.closeFlightDetailsDrawer(page)
    When I close the flight manual quote details drawer
    # TODO: New step + DSL — ManualQuoteCart.openFlightPriceBreakdown(page) (click '.price-breakdown-btn')
    And I open the flight manual quote price breakdown
    # TODO: New step + DSL — ManualQuoteCart.expectFlightChangeFeeHeadline(page)
    Then the flight price breakdown should show the "Change fee" headline
    # TODO: New step + DSL — ManualQuoteCart.expectFlightBaseFare(page, '$1.00')
    And the flight base fare should be "$1.00"
    # TODO: New step + DSL — ManualQuoteCart.expectFlightTaxAmount(page, '$20.00')
    And the flight tax should be "$20.00"
    # TODO: New step + DSL — ManualQuoteCart.expectFlightChangeFeeAmount(page, '$5.00')
    And the flight change fee should be "$5.00"
    # TODO: New step + DSL — ManualQuoteCart.expectFlightSubtotal(page, '$26.00')
    And the flight subtotal should be "$26.00"
    # TODO: New step + DSL — ManualQuoteCart.closeFlightPriceBreakdown(page)
    When I close the flight manual quote price breakdown

    # Testim shared step: Validate_quote_info_in_cart() -> Hotel()
    # TODO: New step + DSL — ManualQuoteCart.scrollCartTo(page, 290)
    When I scroll the cart to the hotel manual quote section
    # TODO: New step + DSL — ManualQuoteCart.openHotelDetailsDrawer(page) (click ticket-top-section link)
    And I open the hotel manual quote details drawer
    # TODO: New step + DSL — ManualQuoteCart.expectHotelRateInformationHeading(page)
    Then the hotel details should show "Rate information"
    # TODO: New step + DSL — ManualQuoteCart.expectHotelConfirmation(page, value)
    And the hotel confirmation should be "Confirmation Number: 34478316577"
    # TODO: New step + DSL — ManualQuoteCart.expectHotelRoomDescription(page, value)
    And the hotel room description should be "standard double"
    # TODO: New step + DSL — ManualQuoteCart.expectHotelCancellationPolicy(page, value)
    And the hotel cancellation policy should be "48HRS Prior to Arrival"
    # TODO: New step + DSL — ManualQuoteCart.expectHotelAmount(page, '$114.00')
    And the hotel amount should be "$114.00"
    # TODO: New step + DSL — ManualQuoteCart.closeHotelDetailsDrawer(page)
    When I close the hotel manual quote details drawer

    # Testim shared step: Validate_quote_info_in_cart() -> Prices_in_cart_summary()
    # TODO: New step + DSL — ManualQuoteCart.expectSummaryHotelAmount(page, '$114.00')
    Then the cart summary hotel amount should be "$114.00"
    # TODO: New step + DSL — ManualQuoteCart.expectSummaryCarAmount(page, '$84.00')
    And the cart summary car amount should be "$84.00"
    # TODO: New step + DSL — ManualQuoteCart.expectSummaryFlightAmount(page, '$26.00')
    And the cart summary flight amount should be "$26.00"
    # TODO: New step + DSL — ManualQuoteCart.expectSummaryTotalAmount(page, '$224.00')
    And the cart summary total should be "$224.00"

    # Testim shared step: Checkout_and_complete_booking()
    # TODO: Reuses existing — Cart.proceedToCheckout (.btn-container span)
    When I proceed to checkout
    # TODO: New step + DSL — Checkout.expectContactDetailsHeading(page) (waitForText 'Contact details')
    Then the checkout page should display "Contact details"
    # TODO: Reuses existing — Checkout.bookAndFinalize
    When I complete the booking
    # TODO: New step + DSL — Checkout.expectBookingSuccess(page, 'Your order has been processed successfully')
    Then the booking should be confirmed with "Your order has been processed successfully"
    # TODO: New step + DSL — Trips.goToTrip(page) (click .btn-container > :nth-child(1))
    When I click Go to Trip
    # TODO: New step + DSL — Trips.expectFlightDetailsButtonVisible(page)
    Then the trip overview should display "Flight details"

    # Testim shared step: Validate_quote_info_in_cart_1() — same assertions repeated after checkout
    # TODO: Reuses ManualQuoteCart.openCarDetailsDrawer + Car* assertions
    When I open the car manual quote details drawer
    Then the car details should show the "Cancellation policy" section
    And the car details should show "Confirmation Number:966231A"
    And the car pickup should be "portland,or,usa,(pdx)"
    And the car dropoff should be "san francisco,ca,usa,(sfo)"
    And the car subtotal should be "$84.00"
    When I close the car manual quote details drawer
    And I open the car mileage dialog
    Then the car mileage dialog should show "no limitation"
    When I close the car mileage dialog
    And I open the flight manual quote details drawer
    Then the flight carrier should be "EL AL"
    And the flight origin should be "LON"
    And the flight destination should be "MAD"
    And the flight number should be "LY1235"
    And the flight amount should be "$26.00"
    When I close the flight manual quote details drawer
    And I open the flight manual quote price breakdown
    Then the flight price breakdown should show the "Change fee" headline
    And the flight base fare should be "$1.00"
    And the flight tax should be "$20.00"
    And the flight change fee should be "$5.00"
    And the flight subtotal should be "$26.00"
    When I close the flight manual quote price breakdown
    And I scroll the cart to the hotel manual quote section
    And I open the hotel manual quote details drawer
    Then the hotel details should show "Rate information"
    And the hotel confirmation should be "Confirmation Number: 34478316577"
    And the hotel room description should be "standard double"
    And the hotel cancellation policy should be "48HRS Prior to Arrival"
    And the hotel amount should be "$114.00"
    When I close the hotel manual quote details drawer
    # Testim Prices_in_cart_summary_1() uses different selectors after checkout
    # TODO: New step + DSL — ManualQuoteCart.expectFlightCardAmount(page, '$26.00') ('.flight-quote-card .amount')
    Then the flight quote card amount should be "$26.00"
    # TODO: New step + DSL — ManualQuoteCart.expectCarCardAmount(page, '$84.00') ('.car-quote-card .amount')
    And the car quote card amount should be "$84.00"
    # TODO: New step + DSL — ManualQuoteCart.expectLastQuoteAmount(page, '$114.00') ('.last-quote .amount')
    And the last quote card amount should be "$114.00"

    Then I successfully cancel the trip
