# Test Name: 71514 Amadeus NDC - Journey legs are not duplicated in Pricing Options
# Description: Multi-city HEL-LON + EWR-LON on an Amadeus NDC corporate account. After narrowing the
# results to 1-stop itineraries, opening a quote's Pricing Options must render exactly one leg tab
# per searched leg - no journey leg repeated. The app builds one tab per priced segment and then
# dedupes them on origin/destination/leg/carrier, so a regression there shows up as a duplicated tab.
# Status: Active
# Labels: Regression,Amadeus,NDC,Flights,multi city,Pricing Options
# Owner: Bruna Santos

# ADO Test Case ID: 71514
@ado:71514
@regression @flights @amadeus @ndc @multi-city @pricing-options @priority:medium
Feature: 71514 Amadeus NDC - Journey legs are not duplicated in pricing options
  As a corporate traveler on an Amadeus NDC account booking a multi-city trip
  I want the pricing options of a 1-stop quote to show one tab per journey leg
  So that I price each leg once instead of picking a fare on a repeated leg

  Scenario: Pricing options of a 1-stop multi-city quote show one tab per leg
    Given I am logged in as "amadeus@ndcCorp.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "HEL-LON, EWR-LON"
    Then flight results should be available
    When I filter results by "1 stop" checkbox
    Then flight results should be available
    When I click to open first pricing options
    Then the pricing options should show 2 leg tabs with no duplicated journey leg
