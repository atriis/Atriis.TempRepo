# Test Name: 47159 Sabre - Hotel - It is possible to save loyalty number with letters and numbers
# Description: 
# Status: Active
# Labels: Regression,Sabre,Hotel,Hotel loyalty number,GDS,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-04T08:57:09Z
# Updated: 2025-09-14T09:18:19Z

@regression @provider:sabre
Feature: 47159 Sabre - can save loyalty number with letters and numbers
  As a corporate traveler using Sabre
  I want to be able to save loyalty number that includes numbers and letters
  So that the loyalty number would be saved successfully

  @priority:high
  Scenario: Can save loyalty number with letters and numbers
    Given I am logged in as "tree@tree.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a hotel search in "MCO" for 1 night
    And I select the trip purpose as "BILLABLE" and proceed
    And I wait for hotel results to load
    And I wait to see view rates text in results page
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I expand the loyalty number extras section
    And I add a new loyalty number "131034317J" for hotel chain "Exclusively Choice (EC)"
    Then the loyalty number "131034317J" and chain "Exclusively Choice (EC)" should be saved

