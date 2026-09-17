# Test Name: 66386 amadeus hotel agreemnst do not send correclty the hotel
# Description: 
# Status: Active
# Labels: Daily Hotels,Regression,2026 plan 2
# Owner: Yael
# Created: 2025-08-27T11:30:52Z
# Updated: 2025-10-28T05:30:13Z

@regression @provider:amadeus
Feature: 66386 Hotels - Amadeus - agreement that is Separate from other agreement appears in results
  As a corporate traveler that has agreement defined in the corporate administration as "Separate from other agreement"
  I want to see this agreement in the hotel level

  @priority:high
  Scenario: Agreement defined as Separate from other agreement appears in hotel level results
    Given I am logged in as "pwc@pec.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "dublin" for 1 night
    And I wait to see view rates text in results page
    Then the first hotel result should display the "Corporate & Agency Rates" agreement
    Then hovering over the "Corporate & Agency Rates" agreement should show "pcw" in the tooltip
    
