# Test Name: 60657 Amadeus Light Ticketing - Invoice is not displayed as FOP even if it is set in admin
# Status: Active
# Labels: Flights,Amadeus,FOP,Amadeus Light Ticketing,Low cost,Regression,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-09T08:57:01Z

@regression @amadeus @flights @fop @light_ticketing
Feature: 60657 Amadeus Light Ticketing - Invoice is not displayed as FOP
  As a corporate traveler
  I want to book a low-cost flight
  So that the correct payment method is shown (credit card, not invoice)

  Scenario: Invoice is not displayed as FOP for light ticketing flights
    Given I am logged in as "lucas" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "STN" to "MAD"
    And I wait for add to trip text to be visible
    And I filter results by carrier "FR"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    # TODO: Verify card ending "**** **** **** 4580" is visible in FOP panel
    # Original Testim: waitForText(".card-name > :nth-child(2)", "**** **** **** 4580")
    # Possible step: Then the card "4580" should be visible
    # TODO: Verify "Invoice" is NOT displayed as a payment option (negative assertion)
    # Original Testim: negative-element-validation step — needs new step
    # Proposed: Then the "Invoice" payment option should not be visible
