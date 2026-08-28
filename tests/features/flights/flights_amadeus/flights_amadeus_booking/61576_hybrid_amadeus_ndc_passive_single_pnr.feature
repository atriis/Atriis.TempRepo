# Test Name: [HYBRID] Amadeus and NDC passive are booked in a single PNR
# ADO Test Case ID: 61576
# Status: Design
# Labels: TESTIM,Amadeus,Amsalem,Single PNR,Hotel,hold flight,Regression,tmc role
# Owner: Noam Miller
# Created: 2025-05-04T07:59:41Z
# Updated: 2026-08-17T12:50:35Z

@regression @amadeus @flights @hotel @single_pnr @tmc @hybrid @ado:61576
Feature: 61576 HYBRID Amadeus - Amadeus and NDC passive booked in a single PNR

  As a TMC agent
  I want the NDC flight passive segments to land in the same PNR as an already booked hotel
  So that the whole trip is held under one PNR

  # NOTE: This is a hybrid test — ADO 61576 marks steps 12-15 as *** Manual ***.
  # The UI flow below covers the automated block (ADO steps 2-11): sign in, book a
  # hotel, then add and hold an NDC flight on the same trip. The passive-segment /
  # PNR verification is done manually by a super-admin in the administration UI or
  # in the logger.

  Scenario: NDC flight held after a hotel booking shares the hotel PNR
    Given I am logged in as "corpSeparate@pnr.ams" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "LON" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    And I click to add a flight to my trip from cart
    When I edit the flight search from "AMS" to "CDG" with the same dates as the hotel search
    And flight results should be available
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I accept Terms & Conditions
    When I hold quote 1
    Then quote 1 status should be "On hold"