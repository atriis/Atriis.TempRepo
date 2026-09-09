# Test Name: 84383 Amadeus NDC - all bookings carrying the corporate CLID
# Description: Round trip CDG-JFK on an Amadeus NDC corporate account. Once results are back, the
# NDC search request sent to Amadeus must carry the traveller's corporate frequent traveller
# details - carrier AY with number 12345679 - so the corporate CLID is attached to every booking
# made from this search.
# Status: Active
# Labels: Regression,Flights,Amadeus,Amadeus NDC,CLID,Payload
# Owner: Bruna Santos

# ADO Test Case ID: 84383
@ado:84383
@regression @flights @amadeus @ndc @clid @payload @priority:high
Feature: 84383 Amadeus NDC - all bookings carrying the corporate CLID
  As a corporate traveler searching Amadeus NDC content
  I want my corporate frequent traveller details sent in the NDC search request
  So that every booking made from those results carries the corporate CLID

  Scenario: The Amadeus NDC search request carries the corporate frequent traveller details
    Given I am logged in as "corp.ama.ndc.mu3@ams.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "CDG" to "JFK"
    Then flight results should be available
    When I capture the "request" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" from Storage
    Then the captured "request" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" should contain "AY".block("frequentTravellerDetails")
    And the captured "block" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" should contain "AY".onKey("carrier")
    And the captured "block" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" should contain "12345679".onKey("number")
