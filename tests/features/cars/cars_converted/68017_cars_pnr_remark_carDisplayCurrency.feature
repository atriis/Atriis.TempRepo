@transportation @cars @regression
Feature: Cars - PNR remark contains carDisplayCurrency

  As a travel administrator
  I want to verify that car rental bookings include currency information in the PNR
  So that the booking system correctly tracks display currency preferences

  Scenario: Book a car and verify carDisplayCurrency is included in PNR
    Given I am logged in as "cars"
    When I book a new trip
    And I add myself as the traveler
    And I search for available cars
    And I add a car from the results to the cart
    And I provide justification for the booking
    And I accept and proceed to checkout
    And I answer required reference fields
    And I book and finalize the trip
    Then the confirmation page should display "Confirmed" status
    And the PNR should contain "DISPLAYGBP" remark via API validation
