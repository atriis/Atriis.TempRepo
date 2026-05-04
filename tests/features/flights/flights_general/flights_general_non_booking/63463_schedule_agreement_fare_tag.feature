# Test Name: 63463 - Search by schedule - Display agreement/ptc fare tag in pricing page
# Status: Active
# Labels: Amadeus,Flights,uniglobe,Agreement,by schedule,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-06-12T08:04:55Z
# Updated: 2025-09-16T06:50:13Z

@regression @flights @general @by-schedule @agreement
Feature: 63463 Flights - Search by schedule display agreement fare tag in pricing page
  As a corporate traveler with an agreement
  I want to see the agreement/PTC fare tag in the pricing page
  So that I can identify negotiated fares

  Scenario: Agreement fare tag is displayed in pricing page for by-schedule search
    Given I am logged in as "agreement" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "EWR" to "CPH" with preferred carrier "Scandinavian" and stops "No stops"
    And I select flight segments by schedule
    And I wait for "Your Selection" text to be visible
    Then the "Agreement" indicator should be visible in the pricing page
