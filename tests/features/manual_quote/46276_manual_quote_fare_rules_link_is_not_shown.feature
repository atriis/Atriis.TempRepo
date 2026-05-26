# Test Name: 46276 Manual quote - "Fare Rules" link is not shown
# Status: Active
# Labels: Regression,Manual Quote,Fare Rules,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-22T07:58:13Z
# Updated: 2025-10-21T11:40:32Z
@regression @manual_quote @flights
Feature: 46276 Manual Quote - Fare Rules link is not shown for flight manual quotes
  As a corporate traveler
  I want manual flight quotes to omit the Fare Rules link
  So that I am not led to fare information that does not apply to manual quotes

  @priority:medium
  Scenario: Flight manual quote does not show a Fare Rules link in details or price breakdown
    Given I am logged in as "camilacoelho@manualquotetravelpolicy.com" booking a new trip
    And I have added myself as the traveler
    And I add a flight manual quote from "LON" to "MAD"
    Then the booking status should be "On hold"
    When I click more details in cart
    Then the fare rules link is not visible in the flight manual quote more details
    And I close more details in cart
    Then I successfully cancel the trip