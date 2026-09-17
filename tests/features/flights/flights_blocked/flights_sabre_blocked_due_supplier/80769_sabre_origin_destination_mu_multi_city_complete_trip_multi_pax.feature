# Test Name: 80769 Sabre - Origin-Destination MU - published rates - multi city - complete trip - extended Paris stay - multi PAX - Non-separated tickets
# Status: Draft
# Labels: Regression,Flights,Sabre,Regular Markup,2026 plan 2

# Source: ADO User Story #77052 - Sabre - Markup alignment

# ADO Test Case ID: 80769
@ado:80769
@regression @flights @sabre @management-fee
Feature: 80769 Sabre - Origin-Destination MU applied on multi city complete trip for multi PAX
  As a corporate traveler with an origin-destination management markup configuration
  I want to search a multi-city complete trip (LIS-PAR-LON-LIS) with an extended stay in Paris for 2 adult passengers
  So that the origin-destination markup (Portugal -> France) is included in the published fare price and the cart total

  @priority:high
  Scenario: Origin-Destination MU (PT->FR) included in published fare pricing and cart for LIS-PAR-LON-LIS complete trip with extended Paris stay, 2 PAX
    Given I am logged in as "corp.full.reg.mu7@sabre.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler

    # Multi-city complete trip with a longer stay in Paris: LIS -> PAR (PT->FR, MU applies) -> LON -> LIS
    When I search for a multi-city flight with legs "LIS-PAR" and "PAR-LON" and "LON-LIS" with a longer stay after the first leg
    And flight results should be available

    # Complete-trip pricing is trip-level, so the exact per-segment 25% cannot be checked here; we assert the
    # MU is present and included in the fare. The 25% is verified in the separated-tickets round-trip test.
    When I open pricing options for the first result with a published fare
    Then the published fare price should include the management markup

    # Select the published fare for each of the 3 legs
    And I select the published fare from pricing options
    And I select the published fare from pricing options
    And I select the published fare from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"

    And the cart total price should equal the published fare price multiplied by the number of selected travelers
    And I open flight details in cart
    Then the flight details drawer total price should match the cart total
    And I close more details in cart
    When I click to open price breakdown in cart
    Then the flight price breakdown should match the totals for the selected travelers
    And I close price breakdown modal
    Then I successfully cancel the trip
