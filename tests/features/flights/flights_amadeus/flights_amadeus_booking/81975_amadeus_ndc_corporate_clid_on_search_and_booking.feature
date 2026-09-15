# Test Name: 81975 Amadeus NDC - Corporate CLID sent at search and returned on the order
# Description: Hold a KLM NDC round trip on an Amadeus NDC corporate account. The CLID must be
# sent at search and returned on the order: the NDC MasterPricer search request carries the
# corporate account number as a frequentTravellerDetails entry for KL, and Amadeus returns it on
# the passenger in the order create response as a LoyaltyProgramAccount - program name
# CORPORATE_ID, program code CLID, account number MVBUZK.
#
# The order create REQUEST does not carry the CLID. Story 76670 put it there, story 83099
# reverted that, so the CLID now reaches the order through the search instead. Verified against
# trip 3862523 on staging: MVBUZK is absent from the AMA_TravelOrderCreateRQ request and present
# in its response.
# Status: Design
# Labels: Amsalem,Amadeus NDC,Flights,Regression,CLID,Payload
# Owner: Noam Miller
# Created: 2026-09-15

# ADO Test Case ID: 81975
@ado:81975 @regression @flights @amadeus @ndc @clid @payload @hold-flight
Feature: 81975 Amadeus NDC - Corporate CLID sent at search and returned on the order
  As a corporate booker holding an Amadeus NDC flight
  I want the corporate Client ID sent at search and carried onto the order automatically
  So that the order is linked to the negotiated corporate account with the airline

  Scenario: The CLID is sent in the NDC search and returned on the passenger in the order
    Given I am logged in as "ndc@amadeus.corp" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "AMS" to "LON"
    Then flight results should be available
    When I capture the "request" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" from Storage
    Then the captured "request" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" should contain "MVBUZK".block("frequentTravellerDetails")
    And the captured "block" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" should contain "KL".onKey("carrier")
    And the captured "block" payload for request type "Amadeus4.Fare_MasterPricerTravelBoardSearch (NDC Search)" should contain "MVBUZK".onKey("number")
    When I filter results by carrier "KLM"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I accept Terms & Conditions
    And I hold the trip
    When I capture the "response" payload for request type "Amadeus4.NDC.AMA_TravelOrderCreateRQ (Booking NDC)" from Storage
    Then the captured "response" payload for request type "Amadeus4.NDC.AMA_TravelOrderCreateRQ (Booking NDC)" should contain "MVBUZK".block("LoyaltyProgramAccount")
    And the captured "block" payload for request type "Amadeus4.NDC.AMA_TravelOrderCreateRQ (Booking NDC)" should contain "CORPORATE_ID".onKey("ProgramName")
    And the captured "block" payload for request type "Amadeus4.NDC.AMA_TravelOrderCreateRQ (Booking NDC)" should contain "CLID".onKey("ProgramCode")
    And the captured "block" payload for request type "Amadeus4.NDC.AMA_TravelOrderCreateRQ (Booking NDC)" should contain "MVBUZK".onKey("AccountNumber")
    Then I successfully cancel the trip
