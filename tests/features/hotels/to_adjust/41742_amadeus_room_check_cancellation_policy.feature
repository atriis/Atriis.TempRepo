# Test Name: 41742 Amadeus - "Add to cart" button is clickable for "check cancellation policy" rooms
# Description: 
# Status: Active
# Labels: Amadeus,Hotel,Regression,cancellation policy,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-01-29T08:35:42Z
# Updated: 2025-05-12T09:00:20Z

@regression @provider:amadeus
Feature: 41742 Amadeus - Add hotel room with "check cancellation policy" label
  As a corporate traveler
  I want to see and add a room with a "check cancellation policy" designation
  So that I know the cancellation terms before booking ambiguous rate types

  @priority:high
  Scenario: Add a "check cancellation policy" room type to cart
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Ibis London Blackfriars" for 1 night
    And I select the first hotel result
    # TODO: Create step "When I add the room marked as check cancellation policy" that calls DSL addCheckCancellationPolicyRoom in RoomLevelResults.js
    Then the booking status should be "Pending booking"
