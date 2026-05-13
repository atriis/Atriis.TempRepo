# Test Name: 22522 Booking.com - Credit card can be added for guest traveler
# Description: 
# Status: Active
# Labels: Booking.com,booking.com 3.1,Hotel,FOP,Regression,credit card,Cart,guest,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-04-21T07:47:05Z
# Updated: 2025-04-21T08:34:31Z

@regression @provider:bookingcom
Feature: 22522 Booking.com - Add credit card for guest traveler
  As a travel agent booking for a guest traveler
  I want to add a credit card in the cart for the guest
  So that the booking can be completed with a valid payment method

  @priority:high
  Scenario: Add credit card for guest traveler booking via Booking.com
    Given I am logged in as "alexandremarg@bookingcomcaneditfop.com" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "EZE" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I add a credit card as payment method
    Then the payment type should be "Paid by Traveller"

