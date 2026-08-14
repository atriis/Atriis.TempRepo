# ADO Test Case ID: 82661
@ado:82661
@transportation @cars @regression @provider:sabre
Feature: 82661 - Sabre car - Customer ID number at search request (GetVehAvailRQ)

  Scenario: Customer ID number at search request
    Given I am logged in as "automation@sabre.tlc" booking a new trip
    And I have added myself as the traveler
    When I initiate a car search at "LHR" with rental agency "Enterprise"
    And I add the first car to cart
    When I capture the "request" payload for request type "GetVehAvailRQ" from Storage
    Then the captured "request" payload for request type "GetVehAvailRQ" should contain "ET".block("RatePrefs")
    Then the captured "block" payload for request type "GetVehAvailRQ" should contain "ID".block("CustLoyalty ")
    Then the captured "block" payload for request type "GetVehAvailRQ" should contain "84167DD".onKey("MembershipId")
    And the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    And I successfully cancel the trip with 60 seconds wait 
