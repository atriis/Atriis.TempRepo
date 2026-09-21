# Domain: Flights | Supplier: Travelfusion | Flow: New Flight Flow (NFF) brand cards
# Route: EIN -> SOF (round trip, outbound +30 days / return +35 days — next month, so the
#        low-cost inventory these fares live on is on sale)
# Verifies the per-fare feature rows on the NFF brand cards render as INCLUDED:
# the feature text plus a green check icon, not the grey "close" / "error_outline" variants.

@regression @flights @fusion @travelfusion @nff @branded-fares @pricing-options @priority:medium @tc:84970
Feature: 84970 Travelfusion - New Flight Flow - Wizz Smart and Plus fares show seat selection and carry-on bag as included with a green check mark
  As a corporate traveler booking a Travelfusion flight with the new flight flow
  I want the Smart and Plus fares to show their included features with a green check mark
  So that I can tell at a glance which entitlements each fare bundles

  Scenario: Smart and Plus fares show seat selection and carry-on bag as included with a green check mark
    Given I am logged in as "amsnewflowfusion@ra.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "EIN" to "SOF" with outbound in 30 days and return in 35 days
    Then flight results should be available
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    Then "Smart" fare should have "Free standard seat selection" text enabled with a green check mark
    And "Smart" fare should have "Carry-on bag included" text enabled with a green check mark
    Then "Plus" fare should have "Free standard seat selection" text enabled with a green check mark
    And "Plus" fare should have "Carry-on bag included" text enabled with a green check mark
