# Test Name: 69863 hotel and flight parallel search - take the hotel dates from the selected flight
# Description: 
# Status: Active
# Labels: Regression,Parallel,Flights,Hotel,results,No Amadeus Hotel Book,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-11-06T01:25:43Z
# Updated: 2025-11-10T12:58:14Z

@regression @provider:general
Feature: 69863 General - Hotel search dates pre-filled from flight search
  As a corporate traveler
  I want to search for flights and then have hotel search dates pre-filled from flight itinerary
  So that I can quickly add a hotel to my trip without re-entering dates

  @priority:high
  Scenario: Hotel search dates are pre-populated from an existing flight search
    Given I am logged in as "general" "shani_corp_nl" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I search for a flight from {string} to {string}" that calls DSL searchFlight in FlightSearch.js
    # TODO: Create step "When I fill in the NL reference fields" that calls DSL fillNLReferenceFields in Checkout.js
    # TODO: Create step "When I navigate to add a hotel to my trip" that calls DSL navigateToAddHotel in Cart.js
    # TODO: Create step "Then the hotel search dates should be pre-filled from my flight itinerary" that calls DSL verifyHotelDatesFromFlight in HotelSearch.js
