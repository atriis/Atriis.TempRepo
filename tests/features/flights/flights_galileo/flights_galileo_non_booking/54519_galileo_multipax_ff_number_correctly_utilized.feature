# Test Name: 54519 Galileo - Multipax - System utilizes FF number correctly upon booking for multiple pax
# Status: Active
# Labels: Galileo,multi pax,Frequent flyer,Regression,Flights,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-11-20T10:29:14Z
# Updated: 2025-09-14T09:34:54Z

@regression @galileo @flights @frequent_flyer @multi_pax
Feature: 54519 Galileo - FF number correctly utilized for multiple pax

  As a corporate traveler
  I want frequent flyer numbers to be correctly utilized for multiple passengers
  So that loyalty benefits are applied to each traveler

  Scenario: Frequent flyer numbers are displayed for each traveler in cart
    Given I am logged in as "jamesroot@galileocorp.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Shawn Craig"
    # The second traveller's chip renders after its profile finishes loading; searching before it is
    # committed runs the search with one passenger and the results never resolve for the pair.
    And the traveler name "Shawn Craig" should be visible in the travelers list
    When I search for a one way flight from "ORD" to "LAS"
    And flight results should be available
    And I filter results by carrier "AA"
    And I add the first flight to cart
    Then the booking status should be "Pending Booking"
    When I click frequent flyer in extras
    Then the FQTV should show "AA - 1234567" for "James Root"
    Then the FQTV should show "AA-******010" for "Shawn Craig"