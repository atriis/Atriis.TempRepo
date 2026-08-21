# Test Name: Fusion - Add to cart successful
# Status: Draft
# Labels: Regression,Flights,Travelfusion,New Flight Flow,Booking Errors
# Source: bug 83135 (duplicate of 83154, fixed by PR 25856)
# ADO Test Case ID: 83313
# ADO workitem ID: 83135
#
# What prevented the add to cart:
#   On 2026-08-14 Travelfusion began returning a required parameter of Type=segment_select
#   (Name=MealTypeOptions) inside the ProcessDetails response. That value was not modelled on the
#   backend's closed enum, and an out-of-set value on an enum-bound member is an XmlSerializer
#   instance-validation error — so it discarded the ENTIRE CommandList document instead of degrading
#   that one parameter. The unhandled failure surfaced as HTTP 500 on POST /api/v3/FlightSelect
#   (add to cart) and on LowCostTermsV3 (calculate), with a generic "Calculation Failure" popup.
#   The quote never reached the cart. Fix: the Type member was re-bound to a plain string so any
#   value — modelled or not — parses.
#
# Scope: not carrier-, route- or parameter-specific. Any Travelfusion carrier returning an unmodelled
#   required-parameter type was affected. D7 (AirAsia X) TPE-KUL is the reported reproduction and is
#   used here only as concrete test data.
# Reproduced on both the OBT and Agent-GTP fronts; this test covers the corporate OBT front.
#
# Flow: New Flight Flow — "Select flight" in results, then the fare on the NFF pricing page.
#
#   The "And I refresh the page" step after login is LOAD-BEARING, do not remove it. Opening a trip
#   in the SAME TAB (which this role does) is an SPA navigation that leaves the store's
#   isNewFlightsBookingFlow at false, so the results card's "Select flight" click renders the OLD
#   pricing-options drawer and .flight-brand-card never appears. Measured 2026-08-20:
#     after login = true | trip opened same tab = false | after reload = true | on results = true
#   A reload re-boots the app so the flag resolves correctly, and it then survives the search.
#   App-side defect, reported separately.
# Expected: the quote is added to the cart with no server error.

@ado:83135 @tc:83313
@regression @flights @fusion @lcc @nff @cart
Feature: 83313 Fusion - Add to cart successful
  As a corporate traveler booking a Travelfusion low-cost flight
  I want adding the selected fare to my cart to succeed
  So that the quote reaches my cart instead of failing with a server error

  @priority:critical
  Scenario: A low-cost fare is added to the cart
    Given I am logged in as "fusion@corp.btp" booking a new trip
    And I refresh the page
    And the selected traveler should be "Gabriel Koopers" by default
    When I search for a one way flight from "TPE" to "KUL"
    Then flight results should be available
    And I filter results by carrier "D7"
    When I select the first flight result in new flight flow
    And I select the outbound first option from pricing options new flight flow
    And I add to cart from pricing options new flight flow
    Then the cart should contain 1 flight quote
    And I successfully cancel the trip
