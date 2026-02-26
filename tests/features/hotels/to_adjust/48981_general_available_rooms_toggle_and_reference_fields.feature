# Test Name: 48981 search for available rooms only
# Description: 
# Status: Active
# Labels: Hotel,Regression,Cart,results,search,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-10-15T02:12:37Z
# Updated: 2025-05-12T10:04:45Z

@regression @provider:general
Feature: 48981 General - Available rooms only toggle and reference field validation
  As a corporate traveler
  I want to toggle "available rooms only" in search and fill reference fields
  So that only bookable rooms are shown and my booking references are recorded

  @priority:high
  Scenario: Available rooms only toggle works and reference fields are validated
    Given I am logged in as "general" "shani_corp_nl" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I toggle the available rooms only option in hotel search" that calls DSL toggleAvailableRoomsOnly in HotelSearch.js
    When I search for a hotel in "LON" for 1 night
    # TODO: Create step "When I fill in the reference fields" that calls DSL fillReferenceFields in Checkout.js
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the reference fields should be visible in cart" that calls DSL verifyReferenceFieldsInCart in Cart.js

