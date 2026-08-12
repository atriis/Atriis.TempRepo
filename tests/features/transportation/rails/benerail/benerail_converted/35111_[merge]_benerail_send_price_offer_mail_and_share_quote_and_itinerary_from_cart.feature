# Test Name: 35111 [Merge] Benerail - send price offer mail and share quote and itinerary from cart
# Description:
# Status: Active
# Labels: merge,share quote,Share Itinerary,price offer,Regression,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-01-03T04:49:41Z
# Updated: 2025-12-23T04:10:45Z
@transportation @rails @benerail @regression
Feature: 35111 Benerail - Send price offer mail and share quote and itinerary from cart
  As a corporate traveler
  I want to send a price offer from results, share the quote and itinerary from cart
  So that I can distribute the Benerail booking details to stakeholders

  # 46315 - validates the share quote from results, so just need cart validation here
  Scenario: Benerail send price offer mail and share quote and itinerary from cart
    Given I am logged in as "pmac@bene.ral" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToNlabk"
    When I add a Benerail one way to the trip
    And the booking status should be "Pending booking"
    When I click the share quote button
    And I wait to see "Subject" field in share dialog
    Then I send the share and see success notification
    And I click the share itinerary button
    Then I wait to see "Subject" field in share dialog
    Then I send the share and see success notification

