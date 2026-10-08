# Test Name: 68492 Sabre - Flights - Booking is successful when using Invoice as FOP
# Status: Active
# Labels: Flights,Full Purchase,Regression,Sabre,Invoice,FOP,GDS,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-06T03:31:49Z
# Updated: 2026-01-19T07:50:39Z

@regression @flights @sabre @full-purchase @fop @invoice @cancel-by-process
Feature: 68492 Sabre - Booking is successful when using Invoice as FOP
  As a corporate traveler
  I want to book a flight using Invoice as the form of payment
  So that the booking completes successfully with TMC billing

  Scenario: Sabre flight booking succeeds with Invoice as FOP
    Given I am logged in as "brunasabre@froschbrunaautomationinvoice.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "SYD" to "MEL"
    And flight results should be available
    And I filter airline results by "Qantas" checkbox
    When I select the first flight result in new flight flow
    And I select the outbound first option from pricing options new flight flow
    And I add to cart from pricing options new flight flow
    Then the booking status should be "Pending booking"
    Then the payment type should be "Paid by TMC"
    When I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
