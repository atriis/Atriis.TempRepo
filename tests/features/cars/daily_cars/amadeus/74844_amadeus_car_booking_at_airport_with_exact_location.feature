# Test Name: 74844 Amadeus - Cars - Airport Exact Location
# Description: Search for car at airport and verify the exact airport location on results, cart, share quote, and then after book
# Status: Active
# ADO User Story: 73948
# Created: 2026-07-09

@transportation @cars @daily_cars @provider:amadeus @ado:74844
Feature: 74844 Amadeus Car Booking Flow with Exact Airport Location
  As a corporate traveler using Amadeus
  I want to book or share cars with exact airport location validation
  So that I can confirm the pickup location before completing or sharing the trip

  @priority:critical
  Scenario: Search for car at Barajas with Avis and verify the exact airport location on results, cart, share quote, and then after book, then cancel
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added a random guest traveler
    When I search for a car at "<pickupLocation>" with rental agency "<agency>"
    Then the car location label at index 0 should contain "<expectedLabel>" on results
    Then the car location at airport index 0 should contain "<expectedAddress>" on results
    # Payload validation (after Car Location List)
    When I capture the "response" payload for request type "Amadeus4.Car_Availability" from Storage
    And the captured "response" payload for request type "Amadeus4.Car_Availability" should contain "<expectedLocationCode>".block("attributeDetails")
    Then the captured "block" payload for request type "Amadeus4.Car_Availability" should contain "<expectedLocationCode>".onKey("attributeType")
    And the captured "block" payload for request type "Amadeus4.Car_Availability" should contain "<expectedLabel>".map("<expectedLocationCode>")
    When I add the first car to cart
    Then the car location label at index 0 should contain "<expectedLabel>" on cart
    Then the car location at airport index 0 should contain "<expectedAddress>" on cart
    When I click the share quote button
    Then the share quote preview should show "<expectedLabel>"
    Then the share quote preview should show "<expectedAddress>"
    When I close the share dialog
    When I proceed to checkout
    And I complete the booking
    Then the car location label at index 0 should contain "<expectedLabel>" on cart
    Then the car location at airport index 0 should contain "<expectedAddress>" on cart
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip

Examples:
      | pickupLocation | agency  | expectedLabel                         | expectedAddress                                    | expectedLocationCode |
      | Barajas        | Alamo   | Barajas (MAD) (Airport - In Terminal) | Enterprise Rent A Car Aeropuerto De Ba, Madrid, ES | NON                  |
