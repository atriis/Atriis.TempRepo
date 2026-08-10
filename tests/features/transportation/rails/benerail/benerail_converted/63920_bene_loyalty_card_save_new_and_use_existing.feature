# Test Name: 63920 Bene - Loyalty card, Save New and Use Existing
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Rail,Rail loyalty numbers,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-06-26T01:43:33Z
# Updated: 2025-10-31T12:13:27Z
@wip @transportation @rails @benerail @regression
Feature: 63920 Benerail - Loyalty card can be saved as new and used as existing at trip level
  As a corporate traveler with a Benerail loyalty card
  I want to save a new loyalty card and use an existing one
  So that my loyalty benefits are applied to the Benerail booking

  Scenario: Benerail loyalty card saved as new and used as existing in trip overview
    Given I am logged in as "pini@bene.ral" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToAmsterdamCe"
    When I add a Benerail one way to the trip
    And the booking status should be "Pending booking"
    When I expand the loyalty number extras section
    And I open the "Enter New" tab in the loyalty section
    And I edit the card number to "30838112345678900"
    And I select the loyalty program containing "club eurostar"
    And I click the save button
    And the booking status should be "Pending booking"
    When I expand the loyalty number extras section
    And I open the "Use Existing" tab in the loyalty section
    And I select the loyalty program containing "club eurostar"
    Then the existing loyalty card number is "30838110019338123"
    And I click the save button
    When I expand the loyalty number extras section
    Then the existing loyalty card number is "30838110019338123"
