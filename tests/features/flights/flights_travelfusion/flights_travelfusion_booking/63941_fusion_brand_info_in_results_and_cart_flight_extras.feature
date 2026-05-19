# Test Name: 63941 Fusion - Brand info displayed in results and cart pages, flight extras available in cart
# Status: Active
# Labels: Fusion,NL government,Branded fares,Regression,Low cost,Pricing Options,2026 plan 2
# Owner: Noam Miller
# Created: 2025-06-30T09:37:56Z
# Updated: 2025-10-14T02:57:01Z

@regression @flights @fusion @branded-fares @pricing-options @full-purchase @priority:high
Feature: 63941 Fusion - Brand info displayed in results and cart, flight extras available in cart
  As a corporate traveler booking a Fusion flight with branded fares
  I want brand info shown in results, pricing options, and cart
  So that I can compare branded fares and select flight extras

  Scenario: Branded fare info displayed in results, pricing options, and cart after booking
    Given I am logged in as "fusion@50687.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "GVA"
    And flight results should be available
    And I click to open flight details
    And I open branded fares from flight details
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer
    And I close flight details window
    And I click to open first pricing options
    And I open branded fares from pricing options
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer
    And I close pricing options modal
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I click to open flight details
    And I open branded fares from flight details
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer
    And I close flight details window
    When I fill credit card cvv if needed
    And I proceed to checkout
    When I complete the booking with Fusion credit card verification
    Then the quote destination should contain "Flight to"
    And I click to open flight details
    And I open branded fares from flight details
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer
    And I close flight details window
