# Test Name: 78404 Galileo - Ryanair Flexiplus fare incorrectly displays 1PC checked baggage
# Status: Active
# Labels: Regression,Galileo,Ryanair,baggage,Flights,2026 plan 2
# Owner: Noam Miller
# Created: 2026-05-31
# Updated: 2026-05-31

@regression @provider:galileo @flights @baggage @ryanair @priority:high
Feature: 78404 Galileo - Ryanair Flexiplus fare should not display 1PC checked baggage

  As a corporate traveler
  I want the Ryanair Flexiplus fare via Galileo to correctly display baggage information
  So that I can see that Flexiplus includes only cabin baggage and no checked baggage

  Scenario: Ryanair Flexiplus fare via Galileo does not display 1PC checked baggage in pricing options
    Given I am logged in as "achBrand@gdg.corp" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "ZAG" to "DUB" on the 2 "Wednesday" of next month
    Then flight results should be available
    When I filter airline results by "Ryanair" checkbox
    And I click to open first pricing options
    Then the "Flexi Plus" brand should be displayed in pricing options
    And the pricing options row containing "Flexi Plus" should not contain "1PC"
