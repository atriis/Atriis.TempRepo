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
    Given I am logged in as "brunasantosnl" booking a new trip
    And I have added myself as the traveler
    When I select rental agency "Budget"
    And I search for a car at "LHR"
    # TODO: Map Testim step Click_on_proceed_after_search___Warning_and_continue().
    When I add the first car to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    # TODO: Map Testim step Vendor_message_is_displayed_in_Share_Quotes_email().
    # TODO: Map Testim step Vendor_message_is_displayed_in_Share_Itinerary_email().
    Then I successfully cancel the trip
