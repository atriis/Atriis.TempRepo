# Test Name: 67751 Amtrak - Destination title and icon are displayed in Trip Overview
# Description:
# Status: Active
# Labels: Amtrak Sabre,Rail,Regression,Cart,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-24T04:34:39Z
# Updated: 2026-01-06T12:37:35Z
@wip @transportation @rails @amtrak @regression
Feature: 67751 Amtrak - Destination title and icon displayed in trip overview
  As a corporate traveler
  I want to see the Amtrak destination title and train icon in the trip overview
  So that I can confirm the booking summary is correctly rendered

  Scenario: Amtrak destination title and icon visible after adding to cart
    Given I am logged in as "alex@amtrakclub.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Amtrak train from "nycToBos"
    And I add an Amtrak one way to the trip
    And the booking status should be "Pending booking"
    Then the Amtrak destination title "Amtrak Rail to Boston, MA - South Station (BOS)" and train icon should be displayed in the trip overview
