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

  # TODO: New user needed — agreement@fare.uni → USER_AGREEMENT
  # Add to .env: USER_AGREEMENT="agreement@fare.uni"

  Scenario: Agreement fare tag is displayed in pricing page for by-schedule search
    Given I am logged in as "agreement" booking a new trip
    And I have added myself as the traveler
    # TODO: Step needed for "Search by schedule with carrier filter: EWR to CPH, carrier Scandinavian"
    # TODO: Step needed for "Select flights with agreement fare"
    # TODO: Step needed for "Verify agreement indication is displayed in pricing page"
