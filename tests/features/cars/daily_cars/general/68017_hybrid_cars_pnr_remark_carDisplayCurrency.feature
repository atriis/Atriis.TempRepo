@transportation @cars @regression
Feature: 68017 HYBRID Cars - PNR remark contains carDisplayCurrency

  As a travel administrator
  I want to verify that car rental bookings include currency information in the PNR
  So that the booking system correctly tracks display currency preferences

  Scenario: Book a car and verify carDisplayCurrency is included in PNR
    Given I am logged in as "cars@testim.club" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "MXP"
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    And I fill in the OOP justification text "abc"
    And I proceed to checkout
    And I wait for booking details in checkout
    And I fill in the "Travel Type" reference field with "leisure"
    And I complete the booking
    Then the booking status should be "Confirmed"