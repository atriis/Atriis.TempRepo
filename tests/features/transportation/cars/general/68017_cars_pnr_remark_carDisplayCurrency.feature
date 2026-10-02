@transportation @cars @regression
Feature: 68017 Cars - PNR remark contains carDisplayCurrency

  As a travel administrator
  I want to verify that car rental bookings include currency information in the PNR
  So that the booking system correctly tracks display currency preferences

  Scenario: Book a car and verify carDisplayCurrency is included in PNR
    Given I am logged in as "cars@testim.club" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR"
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    And I fill in the OOP justification text "abc"
    And I proceed to checkout
    And I wait for booking details in checkout
    And I fill in the "Travel Type" reference field with "leisure"
    And I complete the booking
    Then the booking status should be "Confirmed"
    # The PNR remarks reach Sabre in AddRemarkRQ after the booking confirms, so they are checked
    # after the cancellation has given that call time to land
    And I successfully cancel the trip
    # Club Travel's "DISPLAY{carDisplayCurrency}" remark carries the user's display currency (USD)
    When I capture the "request" payload for request type "AddRemarkRQ" from Storage
    Then the captured "request" payload for request type "AddRemarkRQ" should contain "<Text>DISPLAYUSD</Text>"
