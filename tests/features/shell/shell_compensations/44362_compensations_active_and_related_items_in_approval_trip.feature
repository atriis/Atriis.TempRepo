# Test Name: 44362 Compensations active and related items- in approval trip
# Description:
# Status: Active
# Labels: Regression,Cart,Approval flow,Amadeus,Flights,Compensation,Full Purchase,2026 plan 1
# Owner: pini harush
# Created: 2024-04-02T10:14:01Z
# Updated: 2025-07-21T03:06:46Z

@regression @shell @compensation @approval_flow @flights @provider:amadeus
Feature: 44362 Amadeus - Compensations active and related items in an approval trip
  As a corporate traveler whose company has climate compensation switched on
  I want the Climate Contribution quote to be purchased alongside my flight and to stay linked to it
  So that the compensation is priced into the total, survives the approval flow, and is listed when the trip is cancelled

  Scenario: Purchase a flight with an active climate contribution and verify it through approval and cancellation
    Given I am logged in as "Compensations@active.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "BOS"
    And I add the first flight to cart
    # TODO: Create step 'the "Climate Contribution" compensation quote should be displayed in cart' — assert the compensation quote card is rendered with its Climate Contribution title (Testim: .compensation-quote-card .has-text-weight-semibold = 'Climate Contribution'). New DSL: Cart.verifyCompensationQuoteDisplayed
    Then the "Climate Contribution" compensation quote should be displayed in cart
    # TODO: Testim recorded a 'negative-element-validation' step here that its exporter could not convert — the export contains no selector, target or expected text for it. Resolve from the original Testim step body or ADO test case 44362 before implementing.
    # TODO: Create step 'I open the compensation terms and conditions' — click the terms link on the compensation quote card (Testim: .compensation-quote-card a; base-quote-card emits openTermsAndConditions). New DSL: Cart.openCompensationTermsAndConditions
    When I open the compensation terms and conditions
    # TODO: Create step 'the compensation terms should state that the purchase is non-refundable' — assert the terms dialog body text (Testim: .terms-dialog p matches /The compensation purchase associated with your booking/). New DSL: Cart.verifyCompensationTermsNonRefundable
    Then the compensation terms should state that the purchase is non-refundable
    # TODO: Create step 'I close the compensation terms and conditions dialog' — close the compensation terms dialog (Testim: .terms-dialog .el-dialog__close). Reuse candidate: 'I close the terms and conditions modal' is car-results scoped. New DSL: Cart.closeCompensationTermsAndConditions
    When I close the compensation terms and conditions dialog
    And I accept all Terms & Conditions on the page
    And I click the proceed to checkout button
    And I proceed with the price change
    # TODO: Create step 'the checkout summary should show the "Carbon offset" line' — assert the Carbon offset line in the checkout summary panel (Testim: .last .summary-title = 'Carbon offset'). Reuse candidate: '{string} should be visible in price breakdown' targets the price-breakdown modal, not the summary panel. New DSL: Checkout.verifySummaryLineVisible
    Then the checkout summary should show the "Carbon offset" line
    # TODO: Create step 'I extract the flight amount from the checkout summary' — store the flight line amount for the sum assertion (Testim: getText on the ml-prefixed .amount; result was discarded in source). New DSL: Checkout.extractSummaryFlightAmount
    When I extract the flight amount from the checkout summary
    # TODO: Create step 'I extract the carbon offset amount from the checkout summary' — store the carbon offset line amount (Testim: .last .amount; result was discarded in source). New DSL: Checkout.extractSummaryCarbonOffsetAmount
    And I extract the carbon offset amount from the checkout summary
    # TODO: Create step 'I extract the total amount from the checkout summary' — store the summary total (Testim: .price-summary .amount; result was discarded in source). New DSL: Checkout.extractSummaryTotalAmount
    And I extract the total amount from the checkout summary
    # TODO: Create step 'the checkout summary total should equal the flight amount plus the carbon offset amount' — BROKEN AT SOURCE: Testim called validate_number1_number2_number3(flight, carbon, flt_and_co2) with three variables that are never assigned anywhere in the file, so the check never ran. Reconstructed as store-three-then-assert. New DSL: Checkout.verifySummaryTotalEqualsFlightPlusCarbon, reusing expectSumToBeEqualWithTolerance from src/assertions/numberAssertions
    Then the checkout summary total should equal the flight amount plus the carbon offset amount
    When I complete the booking without navigating to trip overview
    # TODO: Create step 'the compensation quote should be visible after booking' — assert the compensation item is present once booked (Testim: isVisible '.compensation'; result was discarded in source). New DSL: Cart.verifyCompensationQuoteVisible
    Then the compensation quote should be visible after booking
    And the quote status is "On Hold"
    When I click go to trip button
    Then the trip status should be "In approval"
    # TODO: Create step 'the flight quote title should start with {string}' — assert the flight quote card title (Testim: .flight-quote-card .has-text-weight-semibold matches /Flight to/). CartPage.FLIGHT_QUOTE_TITLE already exists. New DSL: Cart.verifyFlightQuoteTitleStartsWith
    And the flight quote title should start with "Flight to"
    When I hover the trip actions menu
    # TODO: Create step 'I open the approval flow from the trip actions menu' — open the approval flow entry of the trip actions dropdown (Testim: #dropdown-menu-4234 > li:nth-child(1), a generated id that must be replaced with a stable selector). New DSL: Cart.openApprovalFlowFromActionsMenu
    And I open the approval flow from the trip actions menu
    # TODO: Create step 'I approve all pending items in the approval flow dialog' — collapses three positional Testim clicks (body > :nth-child(13) .btn, footer > :nth-child(1), body > :nth-child(13) ml-prefixed button) into one business action. New DSL: Cart.approveAllPendingItemsInApprovalFlow
    And I approve all pending items in the approval flow dialog
    # TODO: Create step 'the approval flow should show no pending items' — assert the approval status description (Testim: .status-desc matches /No pending items/). New DSL: Cart.verifyApprovalFlowHasNoPendingItems
    Then the approval flow should show no pending items
    # TODO: Create step 'I close the approval flow dialog' — close the approval flow dialog (Testim: body > :nth-child(13) .el-dialog__close). New DSL: Cart.closeApprovalFlowDialog
    When I close the approval flow dialog
    And I refresh the page
    Then the booking status should be "Finalizing"
    # TODO: Create step 'the flight booking status should be {string} or {string}' — the source asserts a regex alternation /(On hold)|(Confirmed)/, which no single-{string} catalog step covers. Testim selector [aria-describedby='el-tooltip-5132'] is a generated id and must be replaced. New DSL: Cart.verifyBookingStatusIsOneOf
    And the flight booking status should be "On hold" or "Confirmed"
    # TODO: Create step 'I open the related items of the compensation quote' — click the Related items button in the compensation card (compensation-quote-card.vue ticket-related-quotes slot, app-btn with i18n key compensation.relatedItems). New DSL: Cart.openCompensationRelatedItems
    When I open the related items of the compensation quote
    # TODO: Create step 'the compensation related items should list a quote titled {string}' — assert the related-quotes dialog lists the flight (Testim: quote title matches /Flight to/; component compensation-related-quotes.vue). New DSL: Cart.verifyCompensationRelatedItemsContains
    Then the compensation related items should list a quote titled "Flight to"
    # TODO: Create step 'I close the compensation related items dialog' — close the related items dialog (Testim: body > :nth-child(13) .el-dialog__close, a positional index that must be replaced). New DSL: Cart.closeCompensationRelatedItems
    When I close the compensation related items dialog
    And I hover the trip actions menu
    # TODO: Create step 'I open the trip cancellation from the trip actions menu' — DECOMPOSITION: the catalog step 'I successfully cancel the trip' (Cart.cancelTripStrictWithWait) hovers, cancels, confirms and asserts in a single call, leaving nowhere to assert the Climate Contribution line inside the open dialog. Compose the EXISTING CartPage atoms (waitForDropdownMenu, clickCancelTripOption) — do not duplicate them. New DSL: Cart.openTripCancellationDialog
    And I open the trip cancellation from the trip actions menu
    # TODO: Create step 'the trip cancellation dialog should be displayed' — assert the cancellation dialog title (Testim: [aria-label='Trip cancellation'] .el-dialog__title). Reuse CartPage.waitForTripCancellationDialogTitle. New DSL: Cart.verifyTripCancellationDialogDisplayed
    Then the trip cancellation dialog should be displayed
    # TODO: Create step 'the trip cancellation details should list the {string} quote' — THE POINT OF THIS TEST: the compensation must appear in the cancellation details (Testim: .quote-details-container > :nth-child(2) .bold-text = 'Climate Contribution'). New DSL: Cart.verifyTripCancellationDetailsContains
    And the trip cancellation details should list the "Climate Contribution" quote
    # TODO: Create step 'I confirm the trip cancellation successfully' — confirm and assert the success message (Testim: .btn--primary then .msg-description = 'Your trip has been successfully cancelled'). Reuse CartPage.clickConfirmTripCancellationButton and waitForTripCancelledMessage. New DSL: Cart.confirmTripCancellation
    Then I confirm the trip cancellation successfully
