# Test Name: 46738 Galileo - Flight - Optional Services - Text is not disrupted
# Status: Active
# Labels: Regression,Galileo,Flights,Optional Services,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-31T09:15:38Z
# Updated: 2025-11-14T06:05:11Z

@regression @galileo @flights @optional_services
Feature: 46738 Galileo - Optional services text is not disrupted

  As a corporate traveler
  I want optional services text to be displayed correctly
  So that I can read the service descriptions without disruption

  Scenario: Optional services text is correctly displayed for Ryanair via Galileo
    Given I am logged in as "beatrizpamplonacorp" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "DUB"
    And I wait for flight results to be available
    And I filter results by carrier "Ryanair"
    And I add the first flight to cart
    # TODO: Expand optional services section in cart and verify text is not disrupted
    # Testim: scrollToElement + click ".flight-optional-services .is-clickable" + waitForText on option-title
    Then I successfully cancel the trip
