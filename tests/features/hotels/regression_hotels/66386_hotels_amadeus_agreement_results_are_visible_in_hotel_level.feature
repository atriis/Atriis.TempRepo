# Test Name: 66386 amadeus hotel agreemnst do not send correclty the hotel
# Description: 
# Status: Active
# Labels: Daily Hotels,Regression,2026 plan 2
# Owner: Yael
# Created: 2025-08-27T11:30:52Z
# Updated: 2025-10-28T05:30:13Z

@regression @provider:amadeus
Feature: 66386 Hotels - Amadeus - Agreement results are visible in hotel level
  As a corporate traveler with a PwC account
  I want to filter by agreement hotels
  So that only PwC-negotiated hotels are shown in results

  @priority:high
  Scenario: Agreement results are visible in hotel level
    Given I am logged in as "pcw" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Cardiff Lane Dublin" for 1 night
    And I wait to see view rates text in results page
    Then the first hotel result should display the "Corporate rate" agreement
    Then hovering over the "Corporate rate" agreement should show "pcw" in the tooltip
    
