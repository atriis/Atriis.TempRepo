# Test Name: 67455 Share Price Offer from search by schedule results
# Status: Active
# Labels: Amsalem,Amadeus Light Ticketing,price offer,search,by schedule,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-09-21T12:48:56Z
# Updated: 2025-09-30T10:44:42Z

@regression @flights @general @by-schedule @price-offer
Feature: 67455 Flights - Share price offer from search by schedule results
  As a corporate traveler
  I want to share a price offer from search by schedule results
  So that I can send flight options to travelers for selection

  Scenario: Share price offer from search by schedule results
    Given I am logged in as "ryanair_ams" booking a new trip
    And I have added a random guest traveler
    # TODO: Step needed for "Search flights by schedule (route TBD from Testim)"
    # TODO: Step needed for "Share price offer from search by schedule results"
