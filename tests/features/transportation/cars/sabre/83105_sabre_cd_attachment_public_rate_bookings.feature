# ADO Test Case ID: 83105
@ado:83105
@transportation @cars @regression @provider:sabre @full-purchase
Feature: 83105 Sabre Cars - Attach corporate CD to PNR for public-rate bookings

  @priority:high
  Scenario: Attach CD to Sabre car PNR for category L rate when agreement exists, loyalty number unaffected
    Given I am logged in as "automation@sabre.tlc" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "barajas" with rental agency "Alamo"
    And I add the first car to cart
    When I capture the "request" payload for request type "GetVehAvailRQ" from Storage
    Then the captured "request" payload for request type "GetVehAvailRQ" should contain "AL".block("RatePrefs")
    Then the captured "block" payload for request type "GetVehAvailRQ" should contain "ID".block("CustLoyalty ")
    Then the captured "block" payload for request type "GetVehAvailRQ" should contain "30447AA".onKey("MembershipId")
    Then the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    And I store the first quote PNR code
    When I capture the "response" payload for request type "GetReservation" from Storage
    Then the captured "response" payload for request type "GetReservation" should contain "1".onKey("PNRSequence")
    Then the captured "response" payload for request type "GetReservation" should contain "{storedFirstQuotePnrCode}".split(" ")[1]
    When I capture the "request" payload for request type "ModifyCarResarvation" from Storage
    Then the captured "request" payload for request type "ModifyCarResarvation" should contain "1".onKey("RPH")
    Then the captured "request" payload for request type "ModifyCarResarvation" should contain "3044746".block("Corporate")
    Then the captured "block" payload for request type "ModifyCarResarvation" should contain "3044746".onKey("ID")
    And the captured "request" payload for request type "ModifyCarResarvation" should not contain "30447AA"
    And I successfully cancel the trip with 60 seconds wait
