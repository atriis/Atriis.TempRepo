# Test Name: 47193 Manual quote - Flight manual quote is sent for approval successfully
# Status: Active
# Labels: Regression,Manual Quote,Flights,Approval flow,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-14T09:11:53Z
# Updated: 2025-10-21T11:18:05Z
@regression @manual_quote @flights @approval
Feature: 47193 Manual Quote - Flight manual quote is sent for approval
  As a corporate traveler booking for a guest that requires approval
  I want the flight manual quote to be sent for approval
  So that the trip continues through the approval workflow

  @priority:high
  Scenario: Flight manual quote with a random guest traveler is sent for approval
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added a random guest traveler
    And I add a flight manual quote from "LON" to "MAD"
    And I fill in NL reference fields education and courses
    Then the booking status should be "On hold"
    When I click the proceed to checkout button
    And I select the first available financial reference
    And I wait for booking details in checkout
    And I send booking for approval
    And the quote destination should contain "Flight to"
    Then I successfully cancel the trip
