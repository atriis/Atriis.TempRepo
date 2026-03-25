# Test Name: HYBRID for 69750 Amadeus - Flights - Baggage weight is being sent in 'AddMultiElement'
# Description:
# Status: Active
# Labels: Regression,Flights,Full Purchase,baggage,Amadeus Light Ticketing,hybrid,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-11-03T03:12:54Z
# Updated: 2025-12-10T08:51:21Z

@regression @flights @amadeus @baggage @light-ticketing @hybrid
Feature: 69750 Amadeus - Baggage weight sent in AddMultiElement
  As a corporate traveler
  I want baggage weight information to be correctly sent when booking
  So that my baggage preferences are properly recorded

  Scenario: Add baggage and hold Ryanair low-cost flight
    Given I am logged in as "lucas" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "STN" to "RAK"
    And I wait for add to trip text to be visible
    And I filter results by carrier "RK"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I add a credit card as payment method
    # TODO: Add "ABAG" baggage option
    # Testim: Add__ABAG__baggage_option() — opens baggage panel and selects ABAG option
    # Need new step: When I add baggage option "ABAG"
    # DSL: Cart.addBaggageOption(page, "ABAG") → CartPage baggage selectors
    And I accept Terms & Conditions
    And I hold the trip
    Then I successfully cancel the trip
