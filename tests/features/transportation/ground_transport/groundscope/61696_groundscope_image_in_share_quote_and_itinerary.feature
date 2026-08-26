# Test Name: 61696 GroundScope - Car image is displayed in share quote and share itinerary email
# Description:
# Status: Active
# Labels: Groundscope Regression,share quote,Share Itinerary,price offer,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-07T09:11:57Z
# Updated: 2025-08-04T10:47:10Z

@regression @transportation @ground_transport @provider:groundscope @share_quote
Feature: 61696 GroundScope - Image is displayed in share quote and share itinerary

  As a corporate traveler
  I want the GroundScope image to appear in shared quote and itinerary emails
  So that the shared transfer content is visually complete

  Scenario: GroundScope image is visible in quote and itinerary share previews
    Given I am logged in as "elisabete@groundscope.com" booking a new trip
    And I have added myself as the traveler
    When I search for ground transport from airport "lhr" to specific address "emirates"
    And I add the first result to trip
    And the booking status should be "Pending booking"
    When I click the share quote button
    Then the share quote preview should contain a ground transport image
    And I close the share dialog
    When I click the share itinerary button
    Then the share itinerary preview should contain a ground transport image
