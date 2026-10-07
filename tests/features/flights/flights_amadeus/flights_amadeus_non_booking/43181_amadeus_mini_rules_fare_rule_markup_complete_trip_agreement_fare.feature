# Test Name: Amadeus Mini Rules with fare rule markup - Correctly parsed, search by Complete Trip, Agreement fare - ADO 43181
# Status: Active
# Labels: Regression,Flights,Amadeus,Edifact,Mini Rules,Fare Rules Markup,Complete trip,Agreement
# Owner: Pini Harush
# Created: 2026-10-07

# ADO Test Case ID: 43181
# The UNIGLOBE agent sets an agency fare rules markup (Fare Management > Agency Fare Rules Management in
# the legacy GTP administration). henry@uni.com then adds a complete-trip ARN-EWR SAS agreement fare to the
# cart, and the price breakdown's change and cancellation fees, before and after departure, must equal what
# the add-to-cart MiniRule_GetFromPricing reply says plus that markup.
#
# Expected values follow the backend (AmadeusMiniRulesEngine.ParseMiniRules + FareRulesManagementEngine
# .UpdateMiniRules), computed in src/utils/amadeusMiniRules.js. Where the manual test case is looser:
#   - Change before departure reads the highest component-scoped amount (BDM/BDX/BDF/BDG/...), not BDX alone,
#     and BDT only for a group that states none of them; RVA=1 keeps a change permitted even when BDA=0.
#   - After departure: FC 1 is set aside when the reply holds one group per fare component (the ADA "FC 2
#     only" rule), its ADX is read, and ADT is the fallback when ADX is 0.
#   - The markup is added only to an amount or to "no charge"; "not allowed" stays not allowed, and an
#     unfiled change category (FFT=0) with no amount shows "Fee could not be retrieved".
#   - BDA/ADA are read as "most restrictive wins", as the test case says. The package-level parser keeps
#     the LAST BDA/ADA it reads instead, so a reply whose groups disagree on BDA would fail here: that
#     difference is reported, not hidden.
#   - The agency markup only applies while henry's corporation has no corporate fare rules with amounts.
#   - The markup is set in EUR, the currency of the SAS mini rules on dev: a markup in another currency
#     is converted at the agency exchange rate, which a UI test cannot predict.
#
# The agency fare rules are shared dev configuration. The rules found before the change (12 EUR Fixed on
# both fees when this was written) are recorded, and are put back by the final step - or by an After hook
# when the scenario stops earlier.
#
# Tester comment "Regression 2026/03 - Markup is not saved" did not reproduce on 2026-10-07: the markup saved,
# read back, and reached the price breakdown. A related product race was found: when the admin page is loaded
# straight onto this section (URL / reload), its Currency dropdowns rendered EMPTY in 3 of 4 tries (the
# `::currencies` one-time binding loses to the currency list), leaving no currency to save. Opening the
# section from the menu, as here, filled them every time; the DSL still reopens the section if they are empty.

@ado:43181 @regression @flights @amadeus @edifact @mini-rules @markup
Feature: 43181 Amadeus - Price breakdown mini rules add the agency fare rules markup
  As a corporate traveler
  I want the change and cancellation fees in the price breakdown to include my agency's fare rules markup
  So that I know what changing or cancelling the trip will really cost before I book it

  Scenario: Complete trip ARN-EWR SAS agreement fare shows the mini rule change and cancellation fees plus the agency fare rules markup
    Given I am logged in as "henry@uni.com"

    # --- Manual step 2: the agency fare rules markup, set by the UNIGLOBE agent ---
    And I log in to legacy GTP as the agent "uniglobe@noam.com"
    And I open the Agency Fare Rules Management in the legacy GTP administration
    And I set the agency fare rules markup in the legacy GTP administration:
      | fee              | markup | markup type | currency |
      | Change fee       | 10     | Fixed Value | EUR      |
      | Cancellation fee | 20     | Fixed Value | EUR      |
    Then the agency fare rules markup should be saved in the legacy GTP administration

    # --- Manual steps 3-5: complete-trip search, agreement fare to the cart ---
    When I book a new trip
    And I store the current trip number for payload validation
    And I have added myself as the traveler
    And I search for a round trip flight from "ARN" to "EWR"
    And flight results should be available
    And I filter results by carrier "Scandinavian"
    And I filter results to non-stop flights only
    And I click to open first pricing options
    And I select the first agreement fare for every direction from pricing options
    And I note the time before new payload requests are sent
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"

    # --- Manual steps 6-12: the add-to-cart mini rules against the price breakdown ---
    When I capture the latest "response" payload for request type "Amadeus4.MiniRule_GetFromPricing" sent since the noted time from Storage
    And I click to open price breakdown in cart
    Then the change and cancellation fees in the price breakdown should match the captured mini rules plus the agency fare rules markup
    When I close price breakdown modal
    Then I successfully cancel the trip

    # --- Manual step 13: take the markup back out (restores what the agency had before) ---
    When I restore the original agency fare rules markup in the legacy GTP administration
