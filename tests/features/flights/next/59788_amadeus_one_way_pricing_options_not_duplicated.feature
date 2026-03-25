# Test Name: 59788 Amadeus - One Way Flight - Pricing Options are not duplicated
# Status: Active
# Labels: Regression,Amadeus,Flights,additional pricing options,Pricing Options,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-25T10:14:54Z

@regression @amadeus @flights @pricing_options
Feature: 59788 Amadeus - One way pricing options are not duplicated
  As a corporate traveler
  I want to view pricing options for a one way flight
  So that I can confirm that reopening pricing options shows consistent data

  Scenario: Pricing options are not duplicated for one way flight
    Given I am logged in as "taylor" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LHR" to "MNL"
    And I click proceed on the reference fields popup
    And I click to open first pricing options
    # TODO: Extract price from first pricing option, close drawer,
    # reopen pricing options, extract price from second option,
    # and verify the two prices are NOT equal (tolerance 0.09)
    # Original Testim flow:
    #   1. Open pricing options → extract price from option 1
    #   2. Close pricing options drawer
    #   3. Open pricing options again → extract price from option 2
    #   4. Verify option1 != option2 (tolerance 0.09)
    # Proposed new step: Then the pricing options should not have duplicate prices
