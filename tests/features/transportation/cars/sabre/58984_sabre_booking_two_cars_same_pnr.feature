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

  @priority:high
  Scenario: Book two cars and verify they share the same PNR
    Given I am logged in as "automation@sabre.tlc" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Budget"
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    When I edit the car search at "LGW" without changing dates
    And I add the first car to cart
    And I accept all Terms & Conditions on the page
    And I click the proceed to checkout button
    And I complete the booking
    And the booking status should be "Confirmed"
    And I store the first quote PNR code
    And I store the second quote PNR code
    Then the stored quote PNR codes should match
    And I successfully cancel the trip with 60 seconds wait
