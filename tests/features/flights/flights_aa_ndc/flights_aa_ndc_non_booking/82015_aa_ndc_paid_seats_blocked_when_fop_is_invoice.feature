# Test Name: 82015 AA NDC - Booking with INVOICE will not work - paid seats
# Description: The corporate pays by invoice, so no credit card is attached as FOP for the quote.
# AB#80735 blocks selection of every chargeable seat in that case and the seat tooltip must say so.
# Status: Design
# Labels: AA NDC Regression,Flights,Seating,FOP,Invoice
# Owner: Bruna Santos
# Created: 2026-09-04T00:00:00Z
# Updated: 2026-09-04T00:00:00Z

@regression @flights @aa @ndc @seating @fop @invoice
Feature: 82015 AA NDC - Paid seats cannot be selected when the quote is paid by invoice

  As a corporate traveler whose company pays AA NDC flights by invoice
  I want chargeable seats to be blocked with a clear reason
  So that I am told to proceed in GDS instead of buying a seat that has no card to charge

  @priority:medium
  Scenario: Paid seats show the FOP card message and cannot be selected on an invoice-paid quote
    Given I am logged in as "ami@rickan.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LAX" to "LAS"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And the payment type should be "Paid by TMC"
    When I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
    And I hover over a paid seat in the seat map
    Then the seat tooltip should show "Seats must be booked with FOP card. Proceed in GDS."
    And the paid seat should not be selectable
