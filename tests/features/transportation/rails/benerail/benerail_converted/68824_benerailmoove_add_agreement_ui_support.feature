# Test Name: 68824 BenerailMoove - Add Agreement UI Support
# Description:
# Status: Active
# Labels: Rail,Transportation
# Owner: Pedro Carneiro
# Created: 2025-10-10T03:51:37Z
# Updated: 2025-10-22T06:36:23Z
@transportation @rails @benerail @regression
Feature: 68824 Benerail - Agreement UI support in results
  As a corporate traveler
  I want to see agreement information in the Benerail results when a corporate agreement is configured
  So that I can select journeys under my corporate agreement rate

  Scenario: Benerail agreement information is shown in results when configured
    Given I am logged in as "pmac@sncb.ral" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToGbspx"
    And I wait for select text to be visible
    And I expand more options for the first result
    Then the handshake badge should be displayed in at least one of more options results
    And I hover the agreement logo to see the tooltip in more options results
    And I select and add to cart the first agreement fare from more options
    And the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the trip overview should show the journey details button
