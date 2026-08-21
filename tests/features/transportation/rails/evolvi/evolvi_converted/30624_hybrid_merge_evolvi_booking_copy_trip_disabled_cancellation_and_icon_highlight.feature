# Test Name: HYBRID for 30624 [Merge] Evolvi - Booking, copy trip disabled, cancellation and icon highlight
# Description:
# Status: Active
# Labels: Copy Trip,Full Purchase,Regression,hybrid,merge,Rail,Daily Transportation,Evolvi,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2024-01-02T12:42:13Z
# Updated: 2025-09-19T11:32:24Z
@transportation @rails @evolvi @regression @hybrid
Feature: 30624 HYBRID Evolvi - Booking, copy trip disabled, cancellation and icon highlight
  As a corporate traveler
  I want to book a one way Evolvi train and complete all mandatory cart details
  So that the rail quote cannot be copied and the booked trip can be cancelled

  Scenario: Evolvi one way booking with copy trip disabled and trip cancellation
    Given I am logged in as "elisabete@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "licTo105"
    And I acknowledge the push notification
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    And I fill mandatory Evolvi fields in cart
    When I proceed to checkout
    And I complete the booking
    And the booking status should be "Ticketing Complete"
    Then the trip should not be eligible for copy trip
    And I successfully cancel the trip
