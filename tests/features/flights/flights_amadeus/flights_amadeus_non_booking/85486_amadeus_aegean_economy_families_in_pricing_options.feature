# Test Name: 85486: Amadeus (OBT) - Aegean economy fare families (Flex / Comfortfle) appear in Pricing Options
# Description: Bug 85367 - the OBT pricing request never sent searchedCabins, so the per-leg cabin floor fell back to the
#              selected package's cabin and hid the Aegean economy families. Fixed in atriis/Atriis.App PR #425.
# Status: Active
# Labels: Amadeus,Aegean,Pricing Options,Cabin Class,Flights,Regression
# Owner: Yael Alef
# Created: 2026-09-27

@regression @flights @amadeus @provider:amadeus @pricing-options
Feature: 85486 Amadeus - Aegean economy fare families appear in Pricing Options
  As a corporate traveler searching Economy
  I want every Amadeus economy fare family offered in Pricing Options
  So that I can choose a flexible economy fare instead of only the cheapest one

  @priority:high
  Scenario: Economy one way ATH-DXB shows the Aegean Flex and Comfortfle families from Amadeus
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "ATH" to "DXB"
    And I filter results by carrier "Aegean Airlines"
    And I start intercepting the "flightPricing" API response
    And I click to open first pricing options
    Then the flight pricing request should send "searchedCabins" as '["Y"]'
    And the "Flex" brand should be displayed in pricing options
    And the "Comfortfle" brand should be displayed in pricing options
    And the intercepted response should have at least one result where "sourceSystem" is "AMADEUS"
