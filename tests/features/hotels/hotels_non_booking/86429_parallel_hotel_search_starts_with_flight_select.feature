# ADO Bug #85879 - [Hotel][OBT] Hotel search starts only after FlightSelect completes in flight + hotel trip
# Domain: Hotels | App: Traveller - OBT | Flow: flight + hotel parallel search, hotel dates taken from the flight
# Route: VIE -> FRA, the reporter's route (reporter user kai@corp.com does not log in on dev).
# In the sequential flow (round trip, hotel dates not edited) the hotel search now starts together with
# FlightSelect, using the dates of the clicked flight. The user moves to hotel results as soon as FlightSelect
# returns and sees the loader there, and hotel results read the parallel search through its cache key.
# Before the fix the fresh /hotelsearch started only after FlightSelect returned (about 5 s later on dev).
# Not asserted: landing on hotel results while the search still runs. After FlightSelect the app reloads the trip
# twice (3-9 s on dev) before redirecting, so it depends on how fast the hotel supplier answers.
# One way + hotel and flight-only trips are not changed (covered by 34450, 47881, 35708).

@regression @hotels @parallel-search @priority:medium @ado:85879 @tc:86429
Feature: 86429 Hotels - Flight + hotel trip: hotel search starts together with FlightSelect
  As a corporate traveler searching a flight with a hotel
  I want the hotel search to start as soon as I select my flight
  So that I do not wait for the flight selection and the hotel search one after the other

  Scenario: Round trip + hotel - hotel search runs alongside FlightSelect and hotel results reuse it
    Given I am logged in as "testim@parallel.com" booking a new trip
    And I have added myself as the traveler
    And I search for a round trip flight from "VIE" to "FRA" with advanced search as return date type "Arrival" with parallel hotel
    And I click proceed button if visible
    And flight results should be available
    And I extract the arrival date of the outbound first flight option
    And I extract the departure date of the inbound first flight option
    When I start recording the parallel hotel search requests
    And I add the first result to trip
    And I handle conflicting quotes if visible
    And I wait to see view rates text in results page
    Then the parallel hotel search should start together with FlightSelect
    And hotel results should reuse the parallel hotel search cache key
    And the hotel search check-in date should match the arrival date of the outbound first flight
    And the hotel search check-out date should match the departure date of the inbound first flight
