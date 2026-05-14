# Test Name: 61646 BA NDC -  'Optional services will be available after booking is complete' message is displayed in optional services section (blocked by Epic 68942)
# Description:
# Status: Active
# Labels: BA NDC Regression,Optional Services,Flights,Privileges,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-06T10:54:34Z
# Updated: 2026-01-19T01:25:27Z

@regression @flights @ndc @ba @optional-services
Feature: 61646 BA NDC - Optional services unavailable message is displayed before booking

  As a corporate traveler with optional services privilege configured
  I want to expand the optional services section before booking
  So that I can verify the "available after booking" message is displayed

  Scenario: Optional services shows pending message when expanded before booking
    Given I am logged in as "jadeclub@optionalservicespri.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LHR" to "DUB"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click optional services in extras
    Then the optional services unavailable message should be visible
