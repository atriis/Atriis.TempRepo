# Test Name: 86183 Amadeus NDC - seat map aisle gaps follow the real cabin layout (Finnair A350 3-3-3, Business no gap)
# Status: Active
# Labels: Regression,Flights,Amadeus,Amadeus NDC,Seating,Seat Map
# Owner: Yael Alef
# Created: 2026-10-06

# ADO Test Case ID: 86183
# Source: ADO Bug #85940 - [Flight] [Amadeus NDC] OBT seat map draws Finnair 3-3-3 cabin as 2-4-3
#
# The OBT seat map places one aisle gap per column for the whole deck (AB#81269). Finnair AY132
# SIN-HEL (A350) has a narrowed exit row 51 whose outer seats B and K are flagged as aisle seats, which
# moved the left gap for every row: the 3-3-3 economy cabin was drawn A B | C D E H | J K L and a
# traveller paid for middle seat 36B thinking it was next to the aisle. The gaps must now sit after C
# and H on every row, the exit row and the short rows included. A Business cabin still draws no gap.
# On dev, SIN-HEL non-stop on Finnair is AY132 (A350) and its seat map still carries the row-51 flags.

@ado:86183
@regression @flights @amadeus @ndc @seating @seat-map
Feature: 86183 Amadeus NDC - seat map aisle gaps follow the real cabin layout
  As a corporate traveler choosing a seat
  I want the aisle drawn where it really is on the aircraft
  So that I do not pay for a middle seat that looks like an aisle seat

  Scenario: Finnair A350 economy seat map draws the aisle after C and H on every row
    Given I am logged in as "amadeus@ndcCorp.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "SIN" to "HEL"
    Then flight results should be available
    When I filter airline results by "Finnair" checkbox
    And I filter results to non-stop flights only
    And I click to open first pricing options
    And I select the outbound first option from pricing options page
    And I add to cart from pricing options page
    And I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
    Then the seat map aisle should be drawn after columns "C,H" on every row

  Scenario: Finnair A350 Business seat map draws no aisle gap
    Given I am logged in as "amadeus@ndcCorp.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight by schedule from "SIN" to "HEL" with outbound cabin "Business" and return cabin "Business"
    Then flight results should be available
    When I filter results by carrier "Finnair"
    And I filter results to non-stop flights only
    And I open seat map from results and verify it loads
    Then the seat map should be displayed in results
    And the seat map should draw no aisle gap on any row
