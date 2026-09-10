# Test Name: HYBRID for 59611 Galileo hotels - we don't send multi level agreement in the room level in case "AvailableForOtherRates" and hotel chain is not from list
# Description: 
# Status: Active
# Labels: Regression,Hotel,No Amadeus Hotel Book,Galileo,Agreement,multi agreement,hybrid,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-03-16T07:46:58Z
# Updated: 2025-11-10T11:17:18Z

@regression @provider:galileo
Feature: 59611 HYBRID Galileo - Multi-level agreement not sent in room level for non-qualifying hotel chains
  As a corporate traveler using Galileo with multi-level agreement configuration
  I want to verify that multi-level agreement is only sent for hotels from the configured chain list
  So that agreement rates are only applied to qualifying hotel chains

  @priority:high
  Scenario: Multi-level agreement not sent for hotel chain outside configured list
    Given I am logged in as "shmul@tiagreem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "SFO" for 1 night from day 12 of next visible month
    And I wait to see view rates text in results page
    And I log the trip number from the URL
    And I filter hotel results by hotel name "spero"
    When I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    And I navigate back to hotel level results via breadcrumb
    And I wait to see view rates text in results page
    And I apply hotel level filter "Agreement" with option "My corporate"
    And I filter hotel results by hotel name "holiday inn"
    When I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results