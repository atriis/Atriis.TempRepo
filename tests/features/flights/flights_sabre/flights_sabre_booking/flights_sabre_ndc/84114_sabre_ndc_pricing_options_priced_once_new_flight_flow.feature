# Test Name: 84114 Sabre NDC - New Flight Flow - Pricing Options prices each fare option once
# Status: Draft
# Labels: Regression,Flights,Sabre,Sabre NDC,Pricing Options,New Flight Flow,payload,performance
# Owner: Sonia Sousa
# Created: 2026-09-01

# ADO Test Case ID: 84114
# Source: ADO Bug #83755 - Sabre NDC Pricing Options screen: every fare option is priced 2-6 times
#         and the repeat pass is dispatched serially, adding ~60s to the load

@ado:84114
@regression @flights @sabre @sabre-ndc @nff @payload @pricing-options
Feature: 84114 Sabre NDC - New Flight Flow - each fare option is priced exactly once
  As a corporate traveler selecting a Sabre NDC fare in the new flight flow
  I want each brand card to be priced once against the supplier
  So that the fare options render in seconds instead of waiting on repeated pricing calls

  # Same defect through the new flight flow - the fix is in the backend pricing engine, so it has to
  # hold on both front ends. Here the fare options are brand cards on the flight-selection screen.
  # See 84113 for why the offer ids, and not the visible card count, are what prove uniqueness.
  Scenario: Each Sabre NDC fare option is priced once in the new flight flow
    Given I am logged in as "corp.nff.sabre@ndc.gdg" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LGW" to "MAD"
    Then flight results should be available
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards should render within "30" seconds
    And every "Sabre NDC Offer Price*" request should reference a different "offerItemId"
