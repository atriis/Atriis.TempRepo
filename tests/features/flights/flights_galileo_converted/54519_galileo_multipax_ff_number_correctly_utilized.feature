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
    Given I am logged in as "jamesroot" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Shawn Craig"
    When I search for a one way flight from "ORD" to "LAS"
    And I wait for flight results to be available
    And I filter results by carrier "UA"
    And I add the first flight to cart
    # TODO: Expand frequent flyer section in cart and verify:
    # - Tab "James Root" shows FF "UA - 1234567"
    # - Tab "Shawn Craig" shows FF "UA-******010"
    # Testim: scrollToElement(".flight-frequent-flyer .card-title") + click + waitForText on tabs/panes
