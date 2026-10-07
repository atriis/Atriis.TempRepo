# Test Name: Amadeus Mini Rules without fare rule markup - Correctly parsed, search by Schedule, Special PTC fare - ADO 43182
# Status: Active
# Labels: Regression,Flights,Amadeus,Edifact,Mini Rules,Fare Rules Markup,by schedule,Special PTC,Agreement
# Owner: Pini Harush
# Created: 2026-10-07

# ADO Test Case ID: 43182
# The UNIGLOBE agent removes the agency fare rules markup (Fare Management > Agency Fare Rules Management in
# the legacy GTP administration). henry@uni.com then searches DSS-BRU by schedule and, on each leg, picks a TAP
# fare carrying the agreement (handshake) badge whose tooltip names the special PTC MIS - found in the result's
# Pricing Options, as the test case allows. The price breakdown's change and cancellation fees, before and after
# departure, must equal what the add-to-cart MiniRule_GetFromPricing reply says, with no markup added.
#
# Expected values follow the backend (AmadeusMiniRulesEngine.ParseMiniRules), computed in
# src/utils/amadeusMiniRules.js - the same rules 43181 documents, where the manual test case is looser:
#   - Change before departure reads the highest component-scoped amount (BDM/BDX/BDF/BDG/...), not BDX alone,
#     and BDT only for a group that states none of them; RVA=1 keeps a change permitted even when BDA=0.
#   - After departure: FC 1 is set aside when the reply holds one group per fare component (the ADA "FC 2
#     only" rule), its ADX is read, and ADT is the fallback when ADX is 0.
#   - BDA/ADA are read as "most restrictive wins", as the test case says. The package-level parser keeps the
#     LAST BDA/ADA it reads instead, so a reply whose groups disagree on BDA would fail here: that difference
#     is reported, not hidden.
#   - "Removing" the markup: the section cannot delete a saved rule, so it is saved as 0 Fixed Value, which the
#     backend adds as nothing (FareRulesManagementEngine.ApplyFixedAdminFee keeps "no charge" as no charge).
#   - The agency markup is only consulted while henry's corporation has no corporate fare rules with amounts;
#     a corporate markup would show up here as a mismatch.
#
# The tooltip on dev reads "Agency Private Fare; PTC: MIS" (TP1484 via LIS, QA run 2026-10-07). The same TAP
# results also offer marine (PTC SEA, anchor badge) and public fares, so the fare is chosen by its tooltip.
# On that run the MIS fare's reply held ONE Category 31 group and ONE Category 33 group covering FC 1+2
# (change BDA=1 ADA=1 BDX=ADX=143 EUR; cancellation BDA=1 ADA=1, 0 EUR = no charge), so the test case's
# BDA=0-vs-1 and "ADA for FC 2 only" branches were not reached by the live data; the util still handles them.
#
# The agency fare rules are shared dev configuration. The rules found before the change are recorded, and are
# put back by the final step - or by an After hook when the scenario stops earlier.

@ado:43182 @regression @priority:high @provider:amadeus @flights @amadeus @edifact @mini-rules @markup @by-schedule
Feature: 43182 Amadeus - Price breakdown mini rules without agency markup for a by-schedule special PTC fare
  As a corporate traveler
  I want the change and cancellation fees in the price breakdown to be exactly the airline's mini rules
  So that I know what changing or cancelling a special-fare trip will cost before I book it

  Scenario: By-schedule DSS-BRU TAP MIS fare shows the mini rule change and cancellation fees with no markup
    Given I am logged in as "henry@uni.com"

    # --- Manual step 2: no agency fare rules markup, removed by the UNIGLOBE agent ---
    And I log in to legacy GTP as the agent "uniglobe@noam.com"
    And I open the Agency Fare Rules Management in the legacy GTP administration
    And I remove the agency fare rules markup in the legacy GTP administration
    Then the agency fare rules should have no markup in the legacy GTP administration

    # --- Manual steps 3-9: by-schedule search, a TAP MIS agreement fare on each leg, to the cart ---
    When I book a new trip
    And I store the current trip number for payload validation
    And I have added myself as the traveler
    And I search for a flight by schedule from "DSS" to "BRU"
    And flight results should be available
    And I filter results by carrier "TAP"
    And I select the agreement fare with tooltip "PTC: MIS" from the pricing options of the results
    And I confirm the pricing option for the current segment
    And I wait for the change flight button to be visible
    And I filter results by carrier "TAP"
    And I select the agreement fare with tooltip "PTC: MIS" from the pricing options of the results
    And I confirm the pricing option for the current segment
    And I wait for "Your Selection" text to be visible
    Then the "Agreement" indicator should be visible in the pricing page
    When I note the time before new payload requests are sent
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"

    # --- Manual steps 10-16: the add-to-cart mini rules against the price breakdown ---
    When I capture the latest "response" payload for request type "Amadeus4.MiniRule_GetFromPricing" sent since the noted time from Storage
    And I click to open price breakdown in cart
    Then the change and cancellation fees in the price breakdown should match the captured mini rules without any markup
    When I close price breakdown modal
    Then I successfully cancel the trip

    # --- Put the agency's own markup back ---
    When I restore the original agency fare rules markup in the legacy GTP administration
