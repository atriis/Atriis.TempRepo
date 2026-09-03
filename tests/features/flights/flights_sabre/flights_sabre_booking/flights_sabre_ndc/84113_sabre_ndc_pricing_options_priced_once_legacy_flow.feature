# Test Name: 84113 Sabre NDC - Legacy flow - Pricing Options prices each fare option once
# Status: Draft
# Labels: Regression,Flights,Sabre,Sabre NDC,Pricing Options,payload,performance
# Owner: Sonia Sousa
# Created: 2026-09-01

# ADO Test Case ID: 84113
# Source: ADO Bug #83755 - Sabre NDC Pricing Options screen: every fare option is priced 2-6 times
#         and the repeat pass is dispatched serially, adding ~60s to the load

@ado:84113
@regression @flights @sabre @sabre-ndc @payload @pricing-options
Feature: 84113 Sabre NDC - Legacy flow - each fare option is priced exactly once
  As a corporate traveler opening the Pricing Options screen on a Sabre NDC fare
  I want each fare option to be priced once against the supplier
  So that the screen renders in seconds instead of waiting on repeated pricing calls

  # The wait went from ~76s to a ~10s floor once each offer was priced once, so 30s separates fixed
  # from broken without being tight. The offer ids are what prove no offer is re-priced: the screen
  # shows one leg and one cabin at a time, so counting requests against the visible cards fails even
  # when every offer is priced exactly once (24 offers behind 4 Economy cards on this route).
  Scenario: Each Sabre NDC fare option is priced once in the legacy pricing options flow
    Given I am logged in as "corp.sabre@ndc.gdg" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LGW" to "MAD"
    And I wait for add to trip text to be visible
    # By NDC label, not by carrier: the defect is in the Sabre NDC pricing flow, not in one airline.
    When I click to open pricing options for the first NDC direct rate result
    Then the fare options should render within "30" seconds
    And every "Sabre NDC Offer Price*" request should reference a different "offerItemId"
