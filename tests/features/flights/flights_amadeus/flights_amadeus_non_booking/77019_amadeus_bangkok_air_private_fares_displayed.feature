# Test Name: 77019 Amadeus - Display private fares for Bangkok Air (PG)
# Status: Draft
# Labels: Regression,Flights,Amadeus,Private Fares,payload
# Owner: Pinihar
# Created: 2026-10-07

# ADO Test Case ID: 77019 (bug 76711; rule revised by bug 82699)
#
# The manual test classifies a fare as private when its pricing reply carries BOTH indicator 717
# and priceTariffType "P". Since #82699 the product no longer reads 717: Amadeus prints it next to
# published fares too, so it proves nothing. This test holds the product to the rule it implements:
# InformativePricing replies are private on priceTariffType "P" (or a negoFareGroup, or private-rate
# free text); upsell replies carry no priceTariffType and are read from fcmi - a letter is
# negotiated, a digit is published.
#
# A fare on screen is tied to the reply that priced it by amount: the reply's 712 total is the
# response's wholePrice, in the same currency. Bangkok Air does not upsell - its upsell replies come
# back "UPSELL NOT AVAILABLE" - so the private fares here come from InformativePricing.

@ado:77019
@regression @flights @amadeus @private-fares @payload @priority:high
Feature: 77019 Amadeus - Bangkok Air private fares are displayed as private
  As a corporate traveler whose agency has private Bangkok Air fares
  I want those fares marked as agency private fares in the pricing options
  So that I can tell them from the published fares

  Scenario Outline: Bangkok Air fares from <from> to <to> are badged private exactly when Amadeus priced them private
    Given I am logged in as "76711@76711.COM" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "<from>" to "<to>"
    Then flight results should be available
    When I filter results by carrier "Bangkok Air"
    And I start intercepting the flight pricing response
    And I click to open first pricing options
    And I capture whether each fare Amadeus priced in "*Fare_InformativePricingWithoutPNR*" is private from Storage
    And I capture whether each fare Amadeus priced in "*Fare_PriceUpsellWithoutPNR*" is private from Storage
    # Guards against passing on a search where nothing private was filed: every check below would
    # then hold trivially.
    Then Amadeus should have priced at least 1 private fare
    And every fare in the flight pricing response should be badged "Agency Private Fare" only when Amadeus priced it private
    And the pricing options should show the agreement icon on the private fares only

    Examples:
      | from | to  |
      | BKK  | HKG |
      | BKK  | MNL |
