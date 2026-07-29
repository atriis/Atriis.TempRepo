# Test Name: 56179 Amadeus - Car - Vendor message is displayed in emails
# Description:
# Status: Active
# Labels: Amadeus,Cars,share quote,Share Itinerary,Regression,Email,progress page,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-02T12:45:34Z
# Updated: 2025-08-05T07:17:49Z
@regression @cars @provider:amadeus
Feature: 56179 Amadeus car vendor message is displayed in emails
  As a corporate traveler
  I want the supplier vendor message to appear in share emails
  So that quote and itinerary emails contain the correct vendor content

  @priority:high
  Scenario: Complete a car booking and verify vendor messaging in share quote and itinerary emails
    Given I am logged in as "brunasantosnl@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR"
    When I add the first car to cart
    And the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    And the booking status should be "Confirmed"
    # TODO: Then "Vendor message" is displayed in share quote email (verify the wording "Vendor Message" and if there is a content like text under it)
     # TODO: Then "Vendor message" is displayed in share itinerary email (verify the wording "Vendor Message" and if there is a content like text under it)
    Then I successfully cancel the trip
