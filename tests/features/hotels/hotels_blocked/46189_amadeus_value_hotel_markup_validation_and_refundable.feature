# Test Name: 46189 [Merge] Amadeus Value Hotels - "Loyalty number" section is not displayed and booking with no markup from supplier and markup from administration, markup up displayed in room list
# Description: 
# Status: Active
# Labels: Amadeus Value hotel,Regression,Hotel,Clube Viajar,merge,Extras,2026 plan 1
# Owner: Noam Miller
# Created: 2024-05-16T03:43:35Z
# Updated: 2025-01-27T12:38:36Z

@regression @provider:amadeus_value_hotel
#Blocked by supplier
Feature: 46189 Amadeus Value Hotel - Markup validation in room list and refundable booking
  As a corporate traveler using Amadeus Value Hotels
  I want to see the markup applied to hotel rates in room level
  So that I understand the total cost including agency markup

  @priority:critical
  Scenario: Markup is displayed in room list and refundable room can be booked
    Given I am logged in as "joao" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    # TODO: Create step "Then the markup should be shown in the room rate breakdown" that calls DSL verifyMarkupInRoomList in RoomLevelResults.js
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the hotel should appear as refundable in my cart
    Then I successfully cancel the trip

