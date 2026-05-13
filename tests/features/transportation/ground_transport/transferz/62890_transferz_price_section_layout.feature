# Test Name: 62890 Transferz - Validate elements position on price section
# Description:
# Status: Active
# Labels: Transferz Regression,search,Cart,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-06-02T04:30:47Z
# Updated: 2025-10-13T05:56:57Z

@regression @transportation @ground_transport @provider:transferz @search
Feature: 62890 Transferz - Price section elements are displayed in the expected layout

  As a corporate traveler
  I want the Transferz price section elements to appear in the expected order
  So that pricing information is easy to understand on the results page

  Scenario: Transferz price section content is displayed in the expected position
    Given I am logged in as "betoribeiro@transferz.com" booking a new trip
    And I have added myself as the traveler
    When I search for ground transport from airport "LHR" to specific address "Emirates Stadium, Hornsey Road, London, UK" changing the pickup time
    Then ground transport results should be displayed
    And the ground transport price section content should be displayed
