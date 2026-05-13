# Test Name: ** Blocked by bug 66546 *** 38619 Exchange in IB
# Description: Iberia exchange flow with date change, price validation, reissue, and price breakdown checks
# Status: Active (BLOCKED by bug 66546)
# Labels: exchange,Flights,Regression,Iberia,Full Purchase,price,progress page,2026 plan 2
# Owner: Shani Hadar
# Created: 2024-04-21T07:39:47Z
# Updated: 2025-11-25T08:02:51Z

@blocked @regression @flights @iberia @exchange @full-purchase
Feature: 38619 Iberia - Exchange flight with new return date and validate prices
  As a corporate traveler
  I want to exchange an Iberia round trip by changing the return date
  So that the new flight, exchange fee, and total price are reflected in cart and price breakdown

  # NOTE: This scenario is BLOCKED by bug 66546. It is converted with placeholders for assertions
  # that the original Testim test marked with TODO comments (price extractions and number sums).
  Scenario: Exchange a booked Iberia flight with a new return date and verify prices
    Given I am logged in as "Ivri@Andecy.com" booking a new trip
    And I have added myself as the traveler
    # Original booking - LHR/MAD round trip, complete purchase
    When I search for a round trip flight from "LHR" to "MAD"
    # TODO: create step 'When I click proceed after search' that calls the existing `proceed` flow (waitForText 'Proceed' on body > nth-child(15) and click) - or reuse 'I handle conflicting quotes if visible'
    When I handle conflicting quotes if visible
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I fill credit card cvv if needed
    And I proceed to checkout
    And I complete the booking
    # Validate original price details on the booked trip
    # TODO: create step 'Then the trip should display departure airport "LHR" and arrival airport "MAD"' that asserts both airport codes in trip overview
    # TODO: create step 'When I store the original price and original return date' that captures `.amount` from cart price summary and the original return flight date
    # Click change flight from the trip dropdown
    # TODO: create step 'When I click on change flight in trip actions' that hovers `[aria-controls='dropdown-menu-...']` and clicks the Change flight option, then waits for the disabled 'Change flight' button text
    # Change the return date - select inbound segment, open calendar, advance to next month, pick a date
    # TODO: create step 'When I select the return segment for change' that clicks `.flight-segments-container > :nth-child(2) .el-checkbox__inner`
    # TODO: create step 'When I pick a return date in the next month' that opens the date picker, advances to next month, and selects a target date
    # TODO: create step 'When I click change flight to search again' that clicks `.btn-container .btn`
    # Validate details and proceed with the new flight
    # TODO: create step 'Then the new flight choose page should display airports "LHR", "MAD", "MAD", "LHR"' that asserts all four airport tooltip codes
    # TODO: create step 'When I add the first new flight option to trip' that clicks `.flight-list > section:nth-of-type(1) .add-btn`
    # TODO: create step 'Then the your new flight summary should be displayed' that waits for the 'Your new flight' h3 and the four airport tooltips
    # TODO: create step 'When I proceed with the new flight' that clicks `.proceed-with-new-flight`
    # Validate details in cart (Pending Reissue)
    # TODO: create step 'Then the booking status text bold should contain {string}' for 'Pending Reissue' (or reuse existing booking status step if status text matches)
    # TODO: create step 'Then the cart total price should equal original price plus new exchange price' that calls validate_number1_number2_number3 on extracted values
    # Validate details in price breakdown
    When I click to open price breakdown in cart
    # TODO: create step 'Then the price breakdown should display original price label "Price"' that waits for `.rate-information .original-price > :nth-child(1)` to be 'Price'
    # TODO: create step 'Then the price breakdown should display original, exchange, and total amounts matching the stored values' for `.rate-information .subtotal .amount`, `.flight-exchange .subtotal .amount`, `.summary-and-actions .amount`
    When I close price breakdown modal
    # Reissue
    And I proceed to checkout
    # TODO: create step 'Then the contact details traveller phone label should be visible' that asserts `.contact-details-container .el-card__body > :nth-child(1) .label` is 'Traveller Phone'
    # TODO: create step 'Then the contact details traveller phone should start with country code {string}' for '972'
    # TODO: create step 'When I click the Reissue button' that clicks the Reissue button on the checkout page
    # TODO: create step 'Then the reissue success message should be displayed' that waits for `.success-message__title` to be 'Success'
    # TODO: create step 'When I click go to trip from reissue success' that clicks `.btn-container > :nth-child(1)`
    # Validate details in cart (Ticketing Complete)
    # TODO: create step 'Then the booking status text bold should contain {string}' for 'Ticketing Complete'
    # TODO: create step 'Then the cart total amount should equal the stored total price' for `.amount`
    # Validate details in price breakdown after reissue
    When I click to open price breakdown in cart
    # TODO: same price breakdown validations as before reissue
    When I close price breakdown modal
