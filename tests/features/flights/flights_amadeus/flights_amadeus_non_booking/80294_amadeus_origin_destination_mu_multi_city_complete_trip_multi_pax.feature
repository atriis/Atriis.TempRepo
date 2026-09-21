# Test Name: 80294 Amadeus - Origin-Destination MU - published rates - multi city - complete trip - multi PAX - Non-separated tickets
# Status: Draft
# Labels: Regression,Flights,Amadeus,Regular Markup,2026 plan 2

# ADO Test Case ID: 80294
@regression @flights @amadeus @ado:76040 @management-fee
Feature: 80294 Amadeus - Origin-Destination MU applied on multi city complete trip for multi PAX
  As a corporate traveler with an origin-destination management markup configuration
  I want to search a multi-city complete trip for 2 adult passengers
  So that the origin-destination markup (UK -> US) is included in the published fare price and the cart total

  @priority:high
  Scenario: Origin-Destination MU (UK->US) included in published fare pricing and cart for LON-LAS-AMS-BER complete trip, 2 PAX
    Given I am logged in as "full.reg.mu9.corp@amadeus.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler

    # Multi-city complete trip: LON -> LAS (UK->US, MU applies) -> AMS -> BER
    When I search for a multi-city flight with legs "LON-LAS, LAS-AMS, AMS-BER"
    And flight results should be available

    # Validate on the published fare: markup = 50% of the base fare, and wholePrice + markup = displayed price.
    When I open pricing options for the first result with a published fare
    Then the origin-destination markup should be "50" percent of the base fare on the published fare

    # Select the published fare for each of the 3 legs
    And I select the published fare from pricing options
    And I select the published fare from pricing options
    And I select the published fare from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"

    # Verify: cart total = published per-pax price x number of passengers
    And the cart total price should equal the published fare price multiplied by the number of selected travelers
    And I open flight details in cart
    Then the flight details drawer total price should match the cart total
    And I close more details in cart
    When I click to open price breakdown in cart
    Then the flight price breakdown should match the totals for the selected travelers
    And I close price breakdown modal
    Then I successfully cancel the trip
