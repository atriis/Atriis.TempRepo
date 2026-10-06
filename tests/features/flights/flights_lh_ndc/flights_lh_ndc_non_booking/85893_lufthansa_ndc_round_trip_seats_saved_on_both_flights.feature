# Test Name: 85893 Lufthansa NDC - Seats picked on both flights of a round trip are both saved
# Status: Active
# Labels: Regression,Flights,NDC,Lufthansa NDC Regression,Seating
# Owner: Yael Alef
# Created: 2026-10-05

# ADO Test Case ID: 85893
# Source: ADO Bug #85806 - [Flights][OBT] Seat selection - one of the selected seats is sometimes dropped
#
# OBT saves a seat only if its seat map came back with a seat-cache key. The V3 seat map used to build
# that key as a by-product of WPF image rendering; when rendering failed under load, the map still came
# back with selectable seats but no key, and "Save and Close" silently left that flight's seat out
# (reported on SN3618 NCE-BRU). The fix builds the seat data without rendering. The oracles: every map
# that offers seats carries a key, the save holds a seat for both flights, and both show on the cart.
#
# No hold or booking: the seats are saved on the pending-booking quote, so there is nothing to cancel.
# The source-system check pins the Farelogix "Lufthansa" integration, not NDCLH.

@ado:85893
@regression @flights @ndc @lufthansa @seating @priority:high @provider:lufthansa
Feature: 85893 Lufthansa NDC - Seats picked on both flights of a round trip are both saved

  As a corporate traveler
  I want the seat I pick on each flight of a round trip to be kept when I save
  So that no seat is silently dropped while the cart says it was saved

  Scenario: Pick a seat on each Brussels Air flight, save once, and both seats are kept
    Given I am logged in as "claraaguiar@ndclhclara.com" booking a new trip
    And I have added myself as the traveler
    When I start intercepting the "flightSearch" API response
    And I search for a round trip flight from "NCE" to "BRU"
    Then flight results should be available
    And the intercepted response should have at least one result where "sourceSystem" is "LUFTHANSA"
    When I filter airline results by "Brussels Air" checkbox
    And I click to open first pricing options
    And I select the outbound first option from pricing options page
    And I wait for the inbound leg in pricing options page
    And I select the inbound first option from pricing options page
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    When I start recording the flight seat map and seat save requests
    And I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
    And I select the first available flight seat
    And I click next flight button
    And I select the first available flight seat
    And I save and close seat map drawer
    Then every flight seat map that offers seats should carry a seat cache key
    And the seat save request should include a seat for every flight
    And the seating extras should show a "Pending confirmation" seat on every flight
