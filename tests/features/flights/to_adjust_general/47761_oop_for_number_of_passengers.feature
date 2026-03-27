# Test Name: 47761 can see oop for number of passengers
# Status: Active
# Labels: Travel policy,Regression,OOP,Flights,No Amadeus Hotel Book,Full Purchase,multi pax,progress page,Cancel by process,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-07-02T05:34:00Z
# Updated: 2026-01-20T01:01:18Z

@regression @flights @general @oop @travel-policy @multi-pax
Feature: 47761 Flights - Can see OOP for number of passengers
  As a corporate traveler
  I want to see the out of policy indicator when enough passengers trigger the policy
  So that I am aware of policy violations

  Scenario: OOP indicator is visible for number of passengers
    Given I am logged in as "poly" booking a new trip
    # TODO: Complex multi-trip test — first deletes previous trips, then creates two trips
    # TODO: Step needed for "Delete previous trips if they exist"
    # TODO: Step needed for "First trip flow: add traveler, search, add to cart, verify OOP"  
    # TODO: Step needed for "Second trip flow: add multiple travelers, search, add to cart, verify OOP"
    # TODO: Step needed for "Cancel first trip"
