# Test Name: 57930 Ypsilon - Booking with virtual card (VCC)
# Description:
# Status: Active
# Labels: Ypsilon,vcc,Virtual Card,FOP,Flights,Regression,Full Purchase,progress page,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-02-10T08:27:58Z
# Updated: 2025-09-29T02:25:04Z

@regression @flights @ypsilon @fop @vcc @full-purchase
Feature: 57930 Ypsilon - Booking with virtual card (VCC)
  As a corporate traveler using Ypsilon
  I want to book a flight using a virtual card payment method
  So that the booking is completed with the correct form of payment

  Scenario: Book a flight using virtual card (VCC) with 3DS verification
    Given I am logged in as "renatarosa@ypsilonspecifictestclub.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LHR" to "DUB"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    # TODO: Implement step to add virtual card - click ticket-top-section .is-clickable, verify "virtual card testim ypsilon (set a default)" visible, verify checkbox is checked, close dialog
    # TODO: Implement step to fill free text OOP justification if needed (scroll to .oop-title, check if "Out of policy", fill justification, save)
    When I proceed to checkout
    # TODO: Implement Ypsilon 3DS card verification step (Card verification dialog → type '555' → submit → wait → click Go to trip)
    # TODO: Implement book and finalize with warning and continue step (click Book button → click Go to trip → wait for Trip overview)
    Then the booking status should be "Ticketing Complete"
