# Test Name: 47193 Manual quote - Flight manual quote is sent for approval successfully
# Status: Active
# Labels: Regression,Manual Quote,Flights,Approval flow,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-14T09:11:53Z
# Updated: 2025-10-21T11:18:05Z
@regression @manual_quote @flights @approval
Feature: Manual Quote - Flight manual quote is sent for approval
  As a corporate traveler booking for a guest that requires approval
  I want the flight manual quote to be sent for approval
  So that the trip continues through the approval workflow

  @priority:high
  Scenario: Flight manual quote with a random guest traveler is sent for approval
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added a random guest traveler
    # TODO: Reuses ManualQuoteSearch.addOneWayFlightManualQuote
    When I add a one-way flight manual quote from "LON" to "MAD"
    # TODO: New step + DSL — ManualQuoteCart.expectSentForApproval(page) (approval-success confirmation displayed)
    Then the flight manual quote should be sent for approval successfully
    # TODO: New step + DSL — ManualQuoteCart.clickGoToTrip(page) ('Go to trip' button on approval confirmation)
    When I click Go to Trip from the approval confirmation
    # TODO: New step + DSL — Trips.expectOverviewText(page, 'Flight details') (or reuse Trips DSL)
    Then the trip overview should display "Flight details"
    Then I successfully cancel the trip
