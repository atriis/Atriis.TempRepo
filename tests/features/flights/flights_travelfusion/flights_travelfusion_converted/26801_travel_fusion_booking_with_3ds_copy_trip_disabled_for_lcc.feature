# Test Name: 26801 Travel Fusion Booking with 3ds + copy trip disabled for low cost
# Status: Active
# Labels: Fusion,Flights,Regression,No Amadeus Hotel Book,Copy Trip,Sanity,FailedFusion,Daily Flights,progress page,Full Purchase,2026 plan 1
# Owner: Noam Miller
# Created: 2023-06-29T03:44:40Z
# Updated: 2025-10-01T08:00:30Z

@regression @flights @fusion @full-purchase @copy-trip @lcc @priority:critical
Feature: 26801 Travel Fusion - Booking with 3DS and Copy Trip disabled for low-cost flights
  As a corporate traveler booking a Fusion low-cost flight
  I want to complete the booking with 3DS verification and see that Copy Trip is disabled
  So that low-cost flights are correctly flagged as not eligible for copy trip

  Scenario: Fusion booking with 3DS succeeds and Copy Trip is disabled for low-cost flight
    Given I am logged in as "fusionCorp@reg.ams" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "LGW" to "MXP"
    And I add the first flight to cart
    And I fill credit card cvv if needed
    And I proceed to checkout
    When I proceed to checkout and handle Fusion verification
    # TODO: implement 'the ticket details should be visible after booking' — isVisible('.ticket-details') in Testim source (test 26801)
    # TODO: implement 'low cost flights should not be eligible for copy trip' — see Low_cost_flights_are_not_eligible_for_copy_trip() in Testim source (test 26801)
