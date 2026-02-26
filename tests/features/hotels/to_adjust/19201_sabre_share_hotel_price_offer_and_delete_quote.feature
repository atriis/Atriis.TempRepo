# Test Name: 19201 MERGED Sabre hotel E2E + send hotel price offer from results page
# Description: book for Sabre E2E
# Status: Active
# Labels: Hotel,Sabre,GDS,No Amadeus Hotel Book,Full Purchase,share quote,merge,Club,price offer,Results page hotel,Regression,Pre Prod,Daily Hotels,progress page,Giata,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-15T10:06:30Z
# Updated: 2025-11-10T01:30:47Z

@regression @provider:sabre
Feature: 19201 Sabre - Share hotel price offer and delete quote after booking
  As a corporate traveler using Sabre
  I want to share a hotel price offer and then book and delete the quote
  So that I can manage hotel quotes from search to completion

  @priority:high
  Scenario: Share hotel price offer from results, book and delete quote
    Given I am logged in as "sabre" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Denver" for 1 night
    # TODO: Create step "When I share the hotel price offer by email" that calls DSL method shareHotelPriceOfferFromResults in HotelSearch.js
    # TODO: Create step "When I add the first available hotel to my cart" that covers: select first hotel result + view rates + add first room
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    # TODO: Create step "Then the hotel should appear as refundable in the trip overview"
    # TODO: Create step "When I delete the quote from the cart" that calls DSL method deleteQuoteFromCart in Cart.js
