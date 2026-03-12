# Test Name: 56759 amadeus aggregators hotel - cancellation fee appears with markup
# Description: 
# Status: Active
# Labels: Regression,Amadeus Value hotel,No Amadeus Hotel Book,cancellation policy,mark up,results,Cart,Hotel,2026 plan 1
# Owner: Shani Hadar
# Created: 2025-01-26T07:36:56Z
# Updated: 2025-06-09T10:38:30Z

@regression @provider:amadeus_value_hotel
Feature: 56759 Amadeus Value Hotel - Refundable filter with cancellation fee and markup
  As a corporate traveler using Amadeus Value Hotels
  I want to filter by refundable rooms and see the cancellation fee including markup
  So that I understand the true cost of cancelling a refundable booking

  @priority:high
  Scenario: Refundable filter shows cancellation fee with markup applied
    Given I am logged in as "joao" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, United Kingdom" for 1 night
    And I select the first hotel result
    # TODO: Create step "When I filter room results by refundable" that calls DSL filterRoomsByRefundable in RoomLevelResults.js
    # TODO: Create step "Then the cancellation fee with markup should be displayed" that calls DSL verifyCancellationFeeWithMarkup in RoomLevelResults.js
    And I add a refundable room to my cart
    Then the hotel should appear as refundable in my cart
