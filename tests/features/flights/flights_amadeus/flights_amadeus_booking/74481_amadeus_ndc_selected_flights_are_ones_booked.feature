# Test Name: 74481 Amadeus NDC - Selected flights are the ones booked
# Status: Design
# Labels: Amsalem,Amadeus NDC,Flights,Regression,TESTIM
# Owner: Noam Miller
# Created: 2026-03-01

@regression @flights @amadeus @ndc
Feature: 74481 Amadeus NDC - Selected flights are the ones booked
  As a corporate traveler
  I want the flight I add to cart to still be the one that gets held
  So that the NDC offer isn't silently substituted for a different flight

  Scenario: KLM NDC flight numbers match after holding
    Given I am logged in as "ndc@amadeus.corp" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "AMS" to "NTE"
    And I filter results by carrier "KLM"
    Then the "NDC Direct Rate" indicator should be visible in results
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I store the second booked flight number
    And I accept Terms & Conditions
    And I hold the trip
    Then the flight numbers in cart should match the stored flight numbers
    And I successfully cancel the trip
    # Note: ADO step 7 ("If automation failed: Check OfferPrice response") is a manual
    # diagnostic note for investigating failures, not an assertion to automate.
