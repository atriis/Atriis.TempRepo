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

  Scenario: Book a flight using virtual card (VCC)
    Given I am logged in as "renatarosa@ypsilonspecifictestclub.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "PAR" to "DUB"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the payment type should be "Paid by TMC"
    And I proceed to checkout
    When I complete the booking with Ypsilon credit card verification
    Then the booking status should be "Ticketing Complete"
