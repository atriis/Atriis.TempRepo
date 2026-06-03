# Test Name: HYBRID for 49316 Showing all cancelled quotes in GTP
# Description:
# Status: Active
# Labels: Regression,Flights,Hotel,UI,2026 plan 2
# Owner: Bruna Santos
# Created: 2024-08-01T03:04:11Z
# Updated: 2025-09-17T12:19:50Z

@regression @shell @flights @hotels @ui @approval
Feature: 49316 - Showing all cancelled quotes in GTP
  As a corporate traveler using GTP
  I want to book a flight and a hotel and then cancel the entire trip
  So that all cancelled quotes are visible in the trip overview after cancellation

  Scenario: Book a flight and hotel via approval flow then cancel the trip
    Given I am logged in as "victor@approvalflow.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "HND"
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    When I add a credit card as payment method
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    # TODO: accept the price change prompt — no existing step covers clicking the price change confirmation button
    #       Proposed step: When I accept the price change prompt -> Checkout.acceptPriceChangePrompt(page)
    And I wait for booking details in checkout
    And I send booking for approval
    # TODO: click the "Go to trip" button after sending for approval — no existing step covers waitForText(".btn-container > :nth-child(1)", "Go to trip") and clicking it
    #       Proposed step: When I click the go to trip button -> Cart.clickGoToTripButton(page)
    # TODO: verify the trip overview is loaded by checking the PNR code is visible on the flight quote card — no existing step covers waitForText(".flight-quote-card .pnr-code", /PNR/)
    #       Proposed step: Then the PNR code should be visible on the flight quote card -> Cart.verifyFlightQuoteCardPnrVisible(page)
    When I click to add a hotel to my trip from cart
    And I search for a hotel in "london, uk" for 1 night(s) from the cart drawer
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    And I add the first available room to my cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    And the hotel should appear as refundable in cart
    Then the booking status should be "On hold"
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    And I wait for booking details in checkout
    And I send booking for approval
    # TODO: click the "Go to trip" button after the hotel approval submission — no existing step covers waitForText(".btn-container > :nth-child(1)", "Go to trip") and clicking it
    #       Proposed step: When I click the go to trip button -> Cart.clickGoToTripButton(page)
    # TODO: verify the trip overview is loaded by checking the PNR code is visible on the flight quote card — no existing step covers waitForText(".flight-quote-card .pnr-code", /PNR/)
    #       Proposed step: Then the PNR code should be visible on the flight quote card -> Cart.verifyFlightQuoteCardPnrVisible(page)
    Then I successfully cancel the trip
