# Test Name: 85932 Trip total converts a fare management markup that has no markup currency at the fare rate
# Source: ADO Bug #84703 - [Flights] Trip detail total adds the fare management markup without converting it
#
# Listener imports store FareManagementMarkup in the fare currency and leave GtpMarkupCurrency empty.
# Before the fix the trip total converted the fare and tax but added the markup unconverted
# (USD 786.49 instead of 796.25 on prod trip 27673665).
#
# Test data (dev, read-only): corp@ncep3116.ams shows prices in USD. Trip 3710237 holds cancelled
# Amadeus quote 3539699 (ZY8UK4, ORD-DFW): two EUR pricings with markups 116.22 and 117.39 EUR and
# no markup currency. Every dev quote of this shape is cancelled, so the check reads the
# GET /api/v3/quotes?tripId=...&getCancelled=true response the trip page loads.

# ADO Test Case ID: 85932
# ADO workitem ID: 84703 (Bug)
@ado:84703 @tc:85932
@regression @flights @general @amadeus @markup @currency
Feature: 85932 Trip total converts a markup that has no markup currency
  As a corporate traveller who sees prices in USD
  I want a EUR fare management markup converted at the fare's rate
  So that the trip total matches the original-currency total

  Scenario: Cancelled EUR quote with markup and no markup currency shows its total at the fare rate
    Given I am logged in as "corp@ncep3116.ams"
    When I start intercepting the "cancelledQuotes" API response
    And I navigate to trip 3710237
    Then the flight quote 3539699 in the intercepted response should show its markup converted at the fare rate
