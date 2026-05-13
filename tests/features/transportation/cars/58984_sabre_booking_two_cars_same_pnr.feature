# Test Name: 58984 Sabre - Car - When booking two cars, they share the same PNR and booking is complete
# Labels: Sabre, Cars, Regression, PNR, Full Purchase
# Owner: Bruna Santos
# Created: 2025-02-27T04:15:44Z
# Updated: 2025-07-21T11:41:56Z

@regression @cars @sabre @sanity @full-purchase
Feature: 58984 Sabre booking two cars with same PNR

  As a traveler booking multiple cars
  I want both car bookings to share the same PNR
  So that car rentals are linked in the same trip

  Background:
    Given I am logged in as "robsoncruz@sabrecargdg.com" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Book two cars and verify they share the same PNR
    When I have selected Budget as the rental agency
    And I search for a car at "LHR"
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I proceed to checkout
    And I complete the booking
    # TODO: Extract PNR from first car booking
    # TODO: Search for a second car with different dates/location
    When I add the first car to cart
    And I accept Terms & Conditions
    And I complete the booking
    # TODO: Verify both cars share the same PNR
    And I cancel the trip
    Then I successfully cancel the trip
