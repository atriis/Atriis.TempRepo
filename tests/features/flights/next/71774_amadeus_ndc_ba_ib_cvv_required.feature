# Test Name: 71774: Amadeus NDC [OBT] (BA & IB Only) - CVV required when FOP cc
# Description:
# Status: Active
# Labels: Amsalem,Amadeus NDC,FOP,credit card,Flights,Regression,Random CVV,CVV,2026 plan 2
# Owner: Noam Miller
# Created: 2025-12-21T02:06:37Z
# Updated: 2025-12-21T03:42:23Z

@regression @flights @amadeus @ndc @cvv @fop
Feature: 71774 Amadeus NDC - CVV required for BA and IB when FOP is credit card
  As a corporate traveler
  I want CVV to be required for BA and IB NDC bookings
  So that payment authorization is properly secured for these carriers

  Scenario: CVV is required for Iberia NDC booking with credit card
    Given I am logged in as "cvvndc" booking a new trip
    And I have added myself as the traveler
    # TODO: Search round trip with preferred carrier and max 1 stop
    # Testim: Copy_of_Search_flights_round_trip__with_preferred_carrier__up_to_1_stop('MAD', 'BOG', 'Iberia')
    # This sets preferred carrier filter and max stops before searching
    # Need new step: When I search for a round trip flight from "MAD" to "BOG" with preferred carrier "Iberia" and max 1 stop
    When I search for a round trip flight from "MAD" to "BOG"
    # TODO: Add first NDC flight to trip
    # Testim: Copy_of_Add_to_trip_first_flight__NDC_content()
    # Filters for NDC content specifically before clicking Add to trip
    And I add the first flight to cart
    # TODO: Verify CVV not required and random CVV is selected for default card
    # Testim: CVV_not_required__random_cvv_is_seelcted()
    # Checks that default card does not require CVV input
    # TODO: Select different credit card where CVV IS required and random CVV not selected
    # Testim: Select_different_cc__cvv_required__random_cvv_not_selected()
    # Switches card and verifies CVV field becomes mandatory
    # TODO: Set CVV manually
    # Testim: Set_cvv() — fills CVV field
    # Need new steps for CVV validation workflow
    And I proceed to checkout
    And I complete the booking
    Then I successfully cancel the trip
