# Test Name: Test Case 71775: Amadeus NDC [OBT] (all carriers except BA & IB) - CVV not required when FOP credit card
# Description: Clone
# Status: Active
# Labels: Amsalem,Amadeus NDC,FOP,credit card,Flights,Regression,Random CVV,CVV,2026 plan 2
# Owner: Noam Miller
# Created: 2025-12-22T05:24:10Z
# Updated: 2025-12-22T06:26:09Z

@regression @flights @amadeus @ndc @cvv @fop
Feature: 71775 Amadeus NDC - CVV not required for non-BA/IB carriers
  As a corporate traveler
  I want CVV to not be required for non-BA/IB NDC bookings
  So that payment is seamless for carriers that don't need CVV

  Scenario: CVV not required for AA NDC booking with credit card
    Given I am logged in as "cvvndc" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LGA" to "CLT"
    And I wait for add to trip text to be visible
    And I filter results by carrier "AA"
    # TODO: Add first NDC flight to trip
    # Testim: Copy_of_Add_to_trip_first_flight__NDC_content()
    # Filters for NDC content before clicking Add to trip
    And I add the first flight to cart
    # TODO: Verify CVV not required and random CVV is auto-selected
    # Testim: Validate_cvv_not_required__random_cvv_selected()
    # Checks that CVV field is not required for this carrier
    # TODO: Verify switching to different card still doesn't require CVV
    # Testim: Validate_cvv_required__random_cvv_not_selected()
    # Need new steps for CVV validation workflow
    And I proceed to checkout
    And I complete the booking
    Then I successfully cancel the trip
