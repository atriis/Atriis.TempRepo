# Test Name: HYBRID for 55166 Amadeus hotel - can edit loyalty number after checkout
# Description: 
# Status: Active
# Labels: Hotel loyalty number,Regression,Amadeus,Full Purchase,Hotel,hybrid,progress page,2026 plan 2
# Owner: Shani Hadar
# Created: 2024-12-08T05:24:02Z
# Updated: 2025-09-17T12:25:52Z

@regression @provider:amadeus
Feature: 55166 Amadeus - Loyalty number can be edited after hotel checkout
  As a corporate traveler
  I want to add or edit my loyalty number after completing an Amadeus hotel checkout
  So that my loyalty points are tracked even if I enter the number after booking

  @priority:medium
  Scenario: Loyalty number can be added or edited on the confirmed booking page
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    And I select the first hotel result
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    # TODO: Create step "When I add a loyalty number {string} for hotel chain {string} in the trip overview" that calls DSL addLoyaltyNumberAfterCheckout in Trip.js
    # TODO: Create step "Then the loyalty number should be saved and visible in the trip overview" that calls DSL verifyLoyaltyNumberSaved in Trip.js
    # TODO: Create step "Then the loyalty number should be editable after checkout" - hybrid: validate via API/log that loyalty number change is sent post-booking
