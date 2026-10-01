# Bug: ADO #85016 - [Hotel] [Amadeus] Truncated OTA_HotelAvailRS silently drops hotels from search results
# Hotel availability is asked of Amadeus in batches of 50 hotel codes. Amadeus stops writing the reply
# at about 1000 rate rows with no warning, so in dense cities a reply carries only part of the batch
# (prod trip 27859073, Doha: PRV.45 OK, 32 delivered, The Westin Doha WIDOH045 lost). The fix (TMC2
# PR 26878) compares the PRV.n OK counter with the hotels delivered and re-requests exactly the
# undelivered codes, up to 3 rounds.
# On atriis-dev.app Amadeus prices 0-3 hotels per batch (at most ~100 rate rows), so no reply is cut and
# only the "no re-request without a cut reply" half runs; a cut reply in prod/staging exercises both.

# ADO Test Case ID: 85801
@ado:85801
@regression @hotels @provider:amadeus @bug:85016 @non-booking
Feature: 85801 Amadeus - Hotels priced by Amadeus are all returned in results

  @priority:high
  Scenario: Amadeus re-requests the hotels a cut availability reply did not deliver
    Given I am logged in as "amy@gadasy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Doha" for 1 night
    And I click proceed button if visible
    And I wait to see view rates text in results page
    And I wait until "Amadeus4.HotelAvailability.OTA_HotelAvailRQ" requests have been sent for the trip
    When I capture the "request" payload for request type "Amadeus4.HotelAvailability.OTA_HotelAvailRQ" from Storage
    Then the captured "request" payload for request type "Amadeus4.HotelAvailability.OTA_HotelAvailRQ" should contain "WIDOH045"
    And Amadeus hotel availability "Amadeus4.HotelAvailability.OTA_HotelAvailRQ*" should re-request exactly the hotels each reply was cut short of
