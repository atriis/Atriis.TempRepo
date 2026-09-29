# Test Name: 85636 Amadeus NDC - CLID sent according to the lead traveler's user group
# Description: The Amadeus NDC search sends the Client IDs from 'Agreements - Tour Codes / Client Id'
# only when the lead traveler's user group is selected on that agreement. With Anna Jonas as the
# lead traveler the NDC search request carries no frequentTravellerInfo. With James Kristas as the
# lead traveler it carries the Client IDs AA EF766K6, IB OB10321336, UA 046UI. AF IL01340 is not
# checked: AF is on the account's carriers-not-to-search-with list, so its Client ID is not sent.
# Status: Design
# Labels: Regression,Flights,Amadeus,Amadeus NDC,CLID,Payload
# Owner: Noam Miller
# Created: 2026-09-29

# ADO Work Item: 71026
@regression @flights @amadeus @ndc @clid @payload @priority:high
Feature: 85636 Amadeus NDC - CLID sent according to the lead traveler's user group
  As a corporate booker searching Amadeus NDC content
  I want the Client IDs sent only for travelers whose user group is on the agreement
  So that the negotiated corporate account is applied to the right travelers only

  Scenario: The NDC search carries the Client IDs only when the lead traveler's user group is on the agreement
    # ===== PART 1 - Client IDs NOT sent: lead traveler Anna Jonas (user group NOT on the agreement) =====
    Given I am logged in as "clid@pergroup.ams" booking a new trip
    And I have added traveler by name "Anna Jonas"
    And I have added traveler by name "James Kristas"
    When I search for a round trip flight from "NYC" to "FRA"
    Then flight results should be available
    When I capture the "request" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" from Storage
    Then the captured "request" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" should not contain "frequentTravellerInfo"

    # ===== PART 2 - Client IDs SENT: lead traveler James Kristas (user group IS on the agreement) =====
    When I book a new trip
    And I store the current trip number for payload validation
    And I have added traveler by name "James Kristas"
    And I have added traveler by name "Anna Jonas"
    And I search for a round trip flight from "NYC" to "CDG"
    Then flight results should be available
    When I capture the "request" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" from Storage
    Then the captured "request" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" should contain "EF766K6".block("frequentTravellerDetails")
    And the captured "block" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" should contain "AA".onKey("carrier")
    And the captured "request" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" should contain "OB10321336".block("frequentTravellerDetails")
    And the captured "block" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" should contain "IB".onKey("carrier")
    And the captured "request" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" should contain "046UI".block("frequentTravellerDetails")
    And the captured "block" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" should contain "UA".onKey("carrier")
