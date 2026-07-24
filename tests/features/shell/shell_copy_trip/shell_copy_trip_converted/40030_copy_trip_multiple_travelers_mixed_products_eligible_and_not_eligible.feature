# Test Name: 40030 Copy trip for multiple travelers, mixed products (eligible and not eligible for copy)
# Description:
# Status: Active
# Labels: Flights,Copy Trip,Adding Passengers,Amadeus,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
# Owner: Noam Miller
# Created: 2023-12-07T01:31:02Z
# Updated: 2026-02-16T01:58:54Z

@regression @shell @copy-trip @flights @rails
Feature: 40030 - Copy trip for multiple travelers with mixed eligible and non-eligible products
  As a corporate travel booker with multiple travelers
  I want to copy a trip that contains both copy-eligible and non-eligible products
  So that only the eligible products are copied and the non-eligible ones are excluded

  Scenario: Copy a trip with a flight (eligible) and EU rail (not eligible) for two guest travelers
    Given I am logged in as "copytrip@corp.com" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "BOS" to "LHR"
    Then flight results should be available
    When I add the first flight to cart
    And I click proceed button if visible
    Then the booking status should be "Pending booking"
    # TODO: Create step 'I store the outbound and return flight details' — capture the outbound/return segment info for later comparison on the copied trip (Testim: .not-last-segment, .ticket-details flight-info; source vars departInfo/returnInfo)
    When I store the outbound and return flight details
    # TODO: Create step 'I add a round trip EU rail from {string} to {string} to the trip' — add a Benerail EU rail product from the trip (Testim: hover add-product, EU Rail radio, From 'bebmi' To 'nlaho', pick date, select 2nd result, .add-rail-btn). Reuse candidates: 'I search for a one way Benerail train from {string}', 'I add a Benerail one way to the trip'
    And I add a round trip EU rail from "bebmi" to "nlaho" to the trip
    # --- copy the trip: only the flight is eligible ---
    # TODO: Create step 'I open the copy trip dialog' — hover the trip actions menu and click Copy trip (Testim: .dropdowns-container .expand-icon → #el-id-3696-1113 li:nth-child(2)). Reuse candidate: part of 'I copy the trip'
    When I open the copy trip dialog
    # TODO: Create step 'the copy trip dialog should show the message {string}' — assert the copy trip modal intro text (Testim: .cancel-trip-modal p 'The following items will be copied to a new trip')
    Then the copy trip dialog should show the message "The following items will be copied to a new trip"
    # TODO: Create step 'a copy trip dialog item should show {string}' — assert a quote is flagged as non-copyable (Testim: .quote-details-container :nth-child(2) matches /This item can not be copied/)
    And a copy trip dialog item should show "This item can not be copied"
    # TODO: Create step 'I confirm the copy trip' — click the primary Copy trip button in the dialog (Testim: [aria-label='Copy trip'] .btn--primary). Reuse candidate: part of 'I copy the trip'
    When I confirm the copy trip
    # --- validate the copied trip: flight copied, rail excluded ---
    # TODO: the copied trip opens in a new browser tab — switch to it before validating (reuse candidate: 'I work on tab {int}')
    And I work on tab 2
    # TODO: Create step 'the copied trip should show a to pay amount' — assert the copied trip renders a To pay total (Testim: .to-pay 'To pay')
    Then the copied trip should show a to pay amount
    # TODO: Create step 'the copied trip should not contain the EU rail product' — assert the non-eligible rail item is absent from the copied trip (Testim: negative-element-validation, manual in source)
    And the copied trip should not contain the EU rail product
    # TODO: Create step 'the copied trip flight details should match the stored outbound and return details' — assert the copied flight segments match the stored details (Testim: .not-last-segment == departInfo, .ticket-details flight-info == returnInfo)
    And the copied trip flight details should match the stored outbound and return details
    # --- cancel the copied trip, then the original ---
    When I successfully cancel the trip
    And I close tab 2
    Then the booking status should be "Pending booking"
    # TODO: Create step 'the original trip cancellation should warn {string}' — the atomic 'I successfully cancel the trip' step does not assert the warning; add a decomposed cancel-with-warning step if the assertion is required (Testim: cancel-all dialog 'You are about to cancel all items in your trip.', preceded by a negative-element-validation, manual in source)
    When I successfully cancel the trip
