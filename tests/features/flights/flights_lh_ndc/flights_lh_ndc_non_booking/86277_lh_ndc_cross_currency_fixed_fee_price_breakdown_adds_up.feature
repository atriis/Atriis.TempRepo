# Test Name: 86277 LH NDC - Cross-currency fixed fee - Price Breakdown adds up to the cart total
# Status: Draft
# Labels: Regression,Flights,LH NDC,Lufthansa,NDC,Fare Management Markup,Price Breakdown
# Source: ADO Bug #84923 - Trip total and price breakdown disagree by the fare management markup
# ADO Test Case ID: 86277
# ADO workitem ID: 84923
#
# Domain: Flights | Supplier: Lufthansa NDC | Flow: classic results card -> Add to trip (no booking)
# Amsalem (agency 5) carries a fixed 50 EUR fare-management fee stored in GBP plus a 2% currency
# exchange markup, and LH NDC prices in EUR, so the fee is always read back from GBP into the
# pricing currency. The breakdown Price line comes from /api/v3/flightDetails, a separate read of the
# fee from the quote total: before the fix it re-applied the 2% (45.01 instead of 43.27 GBP, 52.01
# instead of 50 EUR), so Price + Tax overshot Subtotal. The check holds in either display currency
# (claraaguiar's profile has been switched between GBP and EUR on dev).
# The breakdown is read straight after add to trip - the quote expires in about 30 minutes and the
# Price Breakdown link is then disabled.

@ado:86277
@regression @flights @ndc @lufthansa @management-fee @price-breakdown @priority:high
Feature: 86277 Lufthansa NDC - Cross-currency fixed fee - Price Breakdown adds up to the cart total
  As a corporate traveler whose agency charges a fixed fee in a currency other than the fare's
  I want the Price Breakdown lines to add up to the Subtotal and the cart total
  So that the fee is shown once, at the same amount the trip charges

  Scenario: LH NDC LCY-FRA added to trip - Price + Tax equals Subtotal equals the cart total
    Given I am logged in as "claraaguiar@ndclhclara.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LCY" to "FRA"
    Then flight results should be available
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to open price breakdown in cart
    Then the flight price breakdown should match the totals for the selected travelers
    And I close price breakdown modal
    Then I successfully cancel the trip
