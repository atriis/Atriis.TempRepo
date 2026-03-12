# Test Name: 21666 MERGED: 2fa expedia
# Description: Supplier issue related to 2FA, Cannot run until they fix it
# Status: Active
# Labels: Expedia,No Amadeus Hotel Book,Full Purchase,Sanity,Keeps failing,Hotel
# Owner: Noam Miller
# Created: 2023-07-16T08:55:00Z
# Updated: 2026-01-26T03:03:25Z

@regression @provider:expedia
Feature: 21666 Expedia - Book hotel for guest traveler with CVV and 2FA
  As a travel agent
  I want to book a hotel for a guest traveler using Expedia
  So that guests can stay at hotels booked through the platform

  @priority:high
  Scenario: Book hotel for random guest traveler with CVV verification
    Given I am logged in as "edi" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "Big Sky" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "When I set the CVV for the selected payment card" that calls DSL method setCVVForCard in CartFop.js
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip

