# Test Name: [Automated] Amadeus Fare Rules - Search by Schedule, Fare rules are displayed for separated tickets - ADO 43174
# Status: Active
# Labels: Regression,Flights,Amadeus,Edifact,Fare Rules,by schedule,separate tickets
# Owner: Pini Harush
# Created: 2026-10-07

# ADO Test Case ID: 43174
# A by-schedule FRA-JFK round trip on Delta out / Lufthansa back is issued as Separated Tickets. Fare rules
# must be displayed on each leg's results page, on the pricing page, in the cart and after booking, and every
# time they are opened Amadeus must be asked with Fare_InformativePricingWithoutPNR (pricing option RP)
# followed by Fare_CheckRules.
# RP is only sent for a fare without an agreement (AmadeusFlightRulesEngine), so each leg opens fare rules
# on, and selects, the first result without an agreement or marine-fare badge (agreement → RW / RU,
# marine PTC fare → PAX / PTC / PSO / RU).
# Request type names as logged on dev (QA run 2026-10-07, trip 3922975).

@ado:43174 @regression @flights @amadeus @edifact @fare-rules @by-schedule @separate-tickets
Feature: 43174 Amadeus - Fare rules are displayed for separated tickets in a by-schedule search
  As a corporate traveler
  I want to read the fare rules of each ticket of a separated-tickets itinerary
  So that I know the conditions of each ticket before and after I book

  Scenario: Fare rules for a Delta + Lufthansa separated-tickets itinerary without agreements from results to booked trip
    Given I am logged in as "henry@uni.com" booking a new trip
    # A guest traveler, not henry's own profile: henry is priced marine (PTC) fares, which never send RP
    And I have added a random guest traveler
    When I search for a flight by schedule from "FRA" to "JFK"
    And flight results should be available

    # --- Outbound FRA-JFK: Delta ---
    When I filter results by carrier "Delta"
    # No non-stop filter here: dev has no non-stop Delta FRA-JFK (it connects in AMS on KLM)
    And I note the time before new payload requests are sent
    And I click to open fare rules for the first result without an agreement
    And I extract the fare rules text for the current leg
    And I close fare rules window
    And I capture the latest "request" payload for request type "Amadeus4.Fare_InformativePricingWithoutPNR" sent since the noted time from Storage
    Then the captured "request" payload for request type "Amadeus4.Fare_InformativePricingWithoutPNR" should contain "<pricingOptionKey>RP</pricingOptionKey>"
    When I capture the latest "request" payload for request type "Amadeus4.Fare_CheckRules" sent since the noted time from Storage
    And I select the first flight segment without an agreement by schedule
    And I wait for the change flight button to be visible

    # --- Return JFK-FRA: Lufthansa, a different carrier, so the itinerary is issued as separate tickets ---
    When I filter results by carrier "Lufthansa"
    And I filter results to non-stop flights only
    And I note the time before new payload requests are sent
    And I click to open fare rules for the first result without an agreement
    And I extract the fare rules text for the current leg
    And I close fare rules window
    And I capture the latest "request" payload for request type "Amadeus4.Fare_InformativePricingWithoutPNR" sent since the noted time from Storage
    Then the captured "request" payload for request type "Amadeus4.Fare_InformativePricingWithoutPNR" should contain "<pricingOptionKey>RP</pricingOptionKey>"
    When I capture the latest "request" payload for request type "Amadeus4.Fare_CheckRules" sent since the noted time from Storage
    And I select the first flight segment without an agreement by schedule
    And I wait for "Your Selection" text to be visible

    # --- Pricing page: the Separated Tickets quote ---
    # Pricing page and cart check only Fare_CheckRules (it follows InformativePricingWithoutPNR) to stay
    # under the dev Internal API rate limit (429) — both requests are checked on each leg and after booking.
    Then the "Separated Tickets" indicator should be visible in the pricing page
    When I note the time before new payload requests are sent
    And I click to open fare rules
    Then the fare rules displayed should match leg 1 extracted from results
    When I click fare rules for the second flight leg
    Then the fare rules displayed should match leg 2 extracted from results
    When I close fare rules window
    And I capture the latest "request" payload for request type "Amadeus4.Fare_CheckRules" sent since the noted time from Storage

    # --- Cart ---
    When I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    When I note the time before new payload requests are sent
    And I click to open fare rules in cart
    Then the fare rules displayed should match leg 1 extracted from results
    When I click fare rules for the second flight leg
    Then the fare rules displayed should match leg 2 extracted from results
    When I close fare rules window
    And I capture the latest "request" payload for request type "Amadeus4.Fare_CheckRules" sent since the noted time from Storage

    # --- Book, then fare rules on the booked trip ---
    # The airline contact-details extra is required before checkout
    When I share the contact details with the airline for quote 1 if requested using email "henry@uni.com"
    And I proceed to checkout
    And I complete the booking
    And I note the time before new payload requests are sent
    And I click to open fare rules in cart
    Then the fare rules displayed should match leg 1 extracted from results
    When I click fare rules for the second flight leg
    Then the fare rules displayed should match leg 2 extracted from results
    When I close fare rules window
    And I capture the latest "request" payload for request type "Amadeus4.Fare_InformativePricingWithoutPNR" sent since the noted time from Storage
    And I capture the latest "request" payload for request type "Amadeus4.Fare_CheckRules" sent since the noted time from Storage

    # Opens the trip actions menu with the retrying hover before cancelling (see 61600)
    And I hover the trip actions menu
    Then I successfully cancel the trip
