# Test Name: 61577 hotel content is taken from the user group of the primary traveler
# Description: 
# Status: Active
# Labels: Booking.com,Hotel,Regression,traveler,user group,multi pax,supplier,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-05-04T07:48:24Z
# Updated: 2025-05-04T09:14:25Z

@regression @provider:bookingcom
Feature: 61577 Booking.com - Supplier filters reflect primary traveler user group
  As a travel arranger
  I want to see supplier filters that correspond to the primary traveler's user group permissions
  So that only allowed suppliers are shown for the traveler

  @priority:high
  Scenario: Supplier filters displayed are based on primary traveler's user group
    Given I am logged in as "bookingcom" "user_one" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I add a second traveler as primary by name {string}" - needs DSL method addTravelerAsPrimary
    When I search for a hotel in "LON" for 1 night
    # TODO: Create step "Then the supplier filters should match the primary traveler's allowed suppliers" that calls DSL verifySupplierFiltersForPrimaryTraveler in HotelSearch.js
