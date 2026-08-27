# Test Name: 53953 hotel loyalty number pre-populated according to the master chain
# Description: 
# Status: Active
# Labels: Regression,Hotel,hotel chain codes,hotel master chain,Hotel loyalty number,Cart,Daily Hotels,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-11-06T06:33:44Z
# Updated: 2025-09-14T06:51:55Z

@regression @hotel_loyalty @provider:general
Feature: 53953 Hotel loyalty number pre-populated according to the master chain
  As a corporate traveler with loyalty numbers configured per hotel chain
  I want the loyalty number to be pre-populated based on the master chain hierarchy
  So that I don't have to manually enter my loyalty number for related hotel chains

  @priority:critical
  Scenario: Loyalty number from same master chain is pre-populated (Case 1: sibling chain)
    Given I am logged in as "Terry@Chain.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "london,united" for 1 night
    And I click proceed button if visible
    And I wait to see view rates text in results page
    And I apply hotel level filter "Hotel Chains" with option "Hilton"
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the loyalty number should be pre-populated with a green success icon
    When I expand the loyalty number extras section
    Then the loyalty chain dropdown should show "Conrad Hotels - 121212"

  @priority:critical
  Scenario: Loyalty number from master chain is pre-populated (Case 2: master chain directly)
    Given I am logged in as "Terry@Chain.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    And I click proceed button if visible
    And I wait to see view rates text in results page
    And I apply hotel level filter "Hotel Chains" with option "Intercontinental"
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the loyalty number should be pre-populated with a green success icon
    When I expand the loyalty number extras section
    Then the loyalty chain dropdown should show "Intercontinental Hotels Group - 686868"
