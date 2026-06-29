# ADO Test Case ID: 80149
@ado:80149
@regression @flights @amadeus @ndc @fop @airplus @cvv
Feature: 80149 Amadeus NDC - Corporate Air Plus credit card does not require CVV for IB and BA
  As a corporate traveler
  CVV is not required when paying with a corproate Air Plus credit card on an Iberia and British flight via Amadeus NDC
  When paying with visa CVV is required

  Scenario: CVV is not required when Air Plus CC is selected as FOP for IB Amadeus NDC flight
    Given I am logged in as "airPlus@cvv.corp" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MAD" to "JFK"
    And I filter results by carrier "IB"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the CVV field should not be displayed
    # Air Plus is the only FOP for this user group and set as defualt
    And I attempt to cancel the trip safely
