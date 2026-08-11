# Test Name: 59289 Bene fare rules on Travel plan and price offer
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-03-13T09:03:27Z
# Updated: 2025-09-29T02:21:42Z
@transportation @rails @benerail @regression
Feature: 59289 Benerail - Fare rules visible in travel plan and price offer emails
  As a corporate traveler
  I want to verify that fare rules are included in the shared travel plan and price offer emails
  So that recipients can see the terms before the booking is confirmed

  Scenario: Benerail fare rules appear in shared travel plan and price offer emails
    Given I am logged in as "pmac@bene.ral" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToNlasc"
    And I add a Benerail one way to the trip
    When I click the share quote button
    Then the fare rules "Conditions of Cancellation and Exchange" and its content should be visible in the Benerail share quote email
    When I close the share dialog
    And I click the share itinerary button
    Then the fare rules "Conditions of Cancellation and Exchange" and its content should be visible in the Benerail share itinerary email
