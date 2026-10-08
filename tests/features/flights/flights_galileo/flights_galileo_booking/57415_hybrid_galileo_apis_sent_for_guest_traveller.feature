# Test Name: HYBRID for 57415 Galileo - APIS is being sent when booking for a guest traveller
# Status: Active
# Labels: hybrid,Galileo,APIS,Flights,guest,Regression,progress page,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-26T04:40:41Z
# Updated: 2026-01-19T07:52:25Z

@regression @galileo @flights @apis @guest @hybrid
Feature: 57415 Galileo - APIS sent when booking for guest traveller

  As a corporate traveler
  I want APIS data to be sent when booking for a guest traveller
  So that passport information is transmitted correctly

  # LHR-NYC returns no results on dev for this user (trips 3925113, 3925114), so the trip flies
  # AMS-JFK, still US-bound and APIS-relevant. Iberia is picked because Aer Lingus, the first
  # result, failed with "Couldn't confirm segments" and asks for airline contact details.
  Scenario: Guest traveller booking sends APIS data
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "AMS" to "JFK"
    And I filter airline results by "Iberia" checkbox
    And I add the first flight to cart
    Then the booking status should be "Pending Booking"
    And I share the contact details with the airline if requested using email "beatrizpamplonacorp@galileo.com"
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    # The guest has a DOB but no passport: the DOCS SSR (////DOB/GENDER//LAST/FIRST) is added in
    # the UniversalRecordModifyReq after the PNR is created (TMC2 #71324).
    When I capture the "request" payload for request type "UniversalRecordModifyReq" from Storage
    Then the captured "request" payload for request type "UniversalRecordModifyReq" should contain "Type=\"DOCS\""

