# Test Name: 57926 BA NDC - Optional services option is displayed in cart before and after booking when privilege is configured (Blocked by Epic 68942)
# Description:
# Status: Active
# Labels: BA NDC Regression,Optional Services,Flights,Full Purchase,Privileges,progress page,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-02-10T06:56:24Z
# Updated: 2026-01-19T01:25:57Z

@regression @flights @ndc @ba @optional-services @full-purchase
Feature: 57926 BA NDC - Optional services is displayed in cart before and after booking

  As a corporate traveler with optional services privilege configured
  I want to book a BA NDC flight and see optional services
  So that I can verify optional services are displayed both before and after booking

  Scenario: Optional services section is visible in cart before and after booking
    Given I am logged in as "jadeclub" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "DOH"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the Optional Services extras section should be visible
    When I handle the OOP justification if needed
    And I proceed to checkout
    And I handle the price change prompt if visible
    And I complete the booking
    Then the Optional Services extras section should be visible after booking
    Then I successfully cancel the trip
