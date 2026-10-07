# Test Name: Amadeus - Mini Rules parsed correctly for separate tickets in single quote - ADO 72121
# Status: Active
# Labels: Regression,Flights,Amadeus,Edifact,Mini Rules,by schedule,separate tickets
# Owner: Pini Harush
# Created: 2026-10-07

# ADO Test Case ID: 72121
# A by-schedule FRA-JFK round trip on Delta out / Lufthansa back is one "Separated Tickets" quote in the
# cart. Adding it sends one MiniRule_GetFromPricing per ticket, and the price breakdown shows one section
# per ticket, headed by its validating carrier. Each section's change and cancellation fees, before and
# after departure, must equal what that ticket's reply says plus the agency fare rules markup.
#
# - Replies are matched to tickets by the route they price. Amadeus names cities there, so the JFK
#   ticket reads FRA-NYC / NYC-FRA.
# - Expected fees follow the backend (AmadeusMiniRulesEngine.ParseMiniRules + FareRulesManagementEngine),
#   computed in src/utils/amadeusMiniRules.js - see the 43181 feature for where that differs from the
#   manual test case's reading of BDX/ADX/BDA/ADA.
# - The markup is read, not changed, from UNIGLOBE's Agency Fare Rules Management (12 EUR Fixed on both
#   fees on dev when this was written). Both tickets' mini rules came in EUR on dev.
# - Manual steps 4-5 ask to "try to" pick a fare changeable/refundable at a fee; the first by-schedule
#   results are taken. On dev the Lufthansa return carries a change fee and is non-refundable, while the
#   Delta outbound is free to change and cancel (QA run 2026-10-07, trip 3923223).

@ado:72121 @regression @flights @amadeus @edifact @mini-rules @by-schedule @separate-tickets
Feature: 72121 Amadeus - Mini rules are parsed per ticket for separated tickets in a single quote
  As a corporate traveler
  I want the price breakdown to show each separate ticket's own change and cancellation fees
  So that I know what changing or cancelling each ticket will cost before I book

  Scenario: By-schedule Delta + Lufthansa separated tickets show each ticket's mini rules in the price breakdown
    Given I am logged in as "henry@uni.com"

    # --- The agency fare rules markup the fees must include (read only) ---
    And I log in to legacy GTP as the agent "uniglobe@noam.com"
    And I open the Agency Fare Rules Management in the legacy GTP administration
    And I use the current agency fare rules markup as the expected markup

    # --- Manual steps 2-3: new trip, search by schedule ---
    When I book a new trip
    And I store the current trip number for payload validation
    And I have added a random guest traveler
    And I search for a flight by schedule from "FRA" to "JFK"
    And flight results should be available

    # --- Manual steps 4-5: outbound on Delta, return on Lufthansa ---
    When I filter results by carrier "Delta"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I filter results by carrier "Lufthansa"
    And I filter results to non-stop flights only
    And I select one flight segment by schedule
    And I wait for "Your Selection" text to be visible
    Then the "Separated Tickets" indicator should be visible in the pricing page

    # --- Manual step 6: the separated tickets quote to the cart ---
    When I note the time before new payload requests are sent
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    And the cart should contain 1 flight quotes

    # --- Manual steps 7-9: one MiniRule_GetFromPricing per ticket, against the price breakdown ---
    When I capture every "response" payload for request type "Amadeus4.MiniRule_GetFromPricing" sent since the noted time from Storage
    And I click to open price breakdown in cart
    Then the change and cancellation fees of each ticket in the price breakdown should match its captured mini rules plus the agency fare rules markup:
      | route   | validating carrier |
      | FRA-NYC | DL                 |
      | NYC-FRA | LH                 |
    When I close price breakdown modal

    # --- Manual step 10 ---
    Then I successfully cancel the trip
