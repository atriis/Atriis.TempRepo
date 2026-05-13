# Test Name: 59131 Quote expiry and check price for NDC- IB
# Description: Quote expiry for NDC- IB and check price
# Status: Active
# Labels: Flights,Iberia,Regression,Expiry,2026 plan 2
# Owner: pini harush
# Created: 2025-03-05T01:37:37Z
# Updated: 2025-03-05T01:48:53Z

@regression @flights @iberia @ndc @expiry
Feature: 59131 Iberia NDC - Quote expiry and check price
  As a corporate traveler
  I want to see the timed-quote badge on an NDC IB quote in cart
  So that I know the quote is time-limited and check price will be required

  Scenario: Timed quote badge is displayed for an NDC IB flight added to cart
    Given I am logged in as "cvv@ib.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "MAD" to "LON"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And the timed quote badge should be visible in cart
