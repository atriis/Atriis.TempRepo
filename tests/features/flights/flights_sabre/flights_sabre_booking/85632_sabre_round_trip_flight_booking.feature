# Test Name: 85632 Sabre - Round trip flight booking
# Description:
# Status: Active
# Labels: Regression,Flights,Sabre,Full Purchase,Cancel by process
# Owner: Bruna Santos
# Created: 2026-09-29

@regression @flights @provider:sabre
Feature: 85632 Sabre - Round trip flight booking
  As a corporate traveler
  I want to book a round trip flight via Sabre GDS
  So that I can complete a full purchase flight booking

  @priority:critical
  Scenario: Book a round trip Sabre flight successfully
    Given I am logged in as "burkhart@e.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "NYC" to "DFW"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Finalising"
