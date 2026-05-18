# Test Name: 47575 Fusion - FQTV is not displayed when pax does not have one configured
# Status: Active
# Labels: FQTV,Fusion,Regression,Flights,Frequent flyer,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-16T02:05:17Z
# Updated: 2025-12-18T09:39:07Z

@regression @flights @fusion @fqtv @priority:medium
Feature: 47575 Fusion - FQTV is hidden when traveler has no FQTV configured
  As a corporate traveler without an FQTV configured
  I want the FQTV section to not be displayed in cart
  So that I am not asked to provide FQTV details I do not have

  Scenario: FQTV section is hidden in cart when traveler has no FQTV configured
    Given I am logged in as "nicolecarolina@fusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "STR" to "BER"
    Then flight results should be available
    When I filter results by carrier "EW"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And the FQTV section should not have frequent flyer details filled in
