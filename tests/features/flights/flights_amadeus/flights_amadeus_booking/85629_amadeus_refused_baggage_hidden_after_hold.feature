# Test Name: 85629 Amadeus - Baggage - A paid bag refused by Amadeus is not shown as purchased after hold, an accepted bag still is
# Status: Active
# Labels: Regression,Amadeus,Flights,Baggage,Hold,Cancel by process,Bug 85338
# Owner: Yael Alef
# Created: 2026-09-29

@regression @daily_flights @flights @provider:amadeus
Feature: 85629 Amadeus - A paid bag refused by Amadeus is not shown as purchased after hold
  As a corporate traveler
  I want the trip to show only the baggage the airline actually accepted
  So that I am never told I have a checked bag I do not have (bug 85338)

  # Amadeus refuses to price CHECKED BAG UP TO 23 KG on KLM flights operated by Air Baltic
  # (Service_IntegratedPricing 24698 / EC). The hold still succeeds, the bag is kept on the quote as
  # failed at price 0, and Flight Details must show only the included allowance.
  # Every assertion after the hold runs once the trip is cancelled, so a failure never leaves a PNR.

  @priority:high
  Scenario: A paid bag refused by Amadeus is not charged and not listed in Flight Details
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "AMS" to "RIX" with outbound in 21 days and return in 24 days
    Then flight results should be available
    And I filter results by carrier "KLM"
    And I click to open first pricing options
    And I select the pricing option containing "Standard"
    And I select the pricing option containing "Standard"
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    When I extract the total cart summary price
    And I select the "CHECKED BAG UP TO 23 KG" baggage option for the "outbound" flight
    And I click the save button
    Then the baggage green icon should be visible
    When I extract the total cart summary price
    Then the extracted price at index 1 should be greater than the extracted price at index 0
    When I share the contact details with the airline if requested using email "ruimariano@amadeus.com"
    And I accept Terms & Conditions
    And I hold the trip
    And I extract the total cart summary price
    And I successfully cancel the trip
    Then the extracted price at index 2 should equal the extracted price at index 0 within tolerance
    When I navigate to the scenario trip
    And I open flight details in cart
    Then the baggage "CHECKED BAG UP TO 23 KG" should not be displayed in flight details

  @priority:high
  Scenario: A paid bag Amadeus accepts is still charged and listed in Flight Details
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "BUD" to "TLV"
    And I filter results by carrier "EL AL"
    And I click to open first pricing options
    When I select the fare with baggage "1 PC"
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    When I extract the total cart summary price
    And I click to edit the baggage extras section
    And I click number of baggage
    And I click dropdown option "BAG"
    And I click the save button
    Then the baggage green icon should be visible
    When I extract the total cart summary price
    Then the extracted price at index 1 should be greater than the extracted price at index 0
    When I share the contact details with the airline if requested using email "ruimariano@amadeus.com"
    And I accept Terms & Conditions
    And I hold the trip
    And I extract the total cart summary price
    And I successfully cancel the trip
    Then the extracted price at index 2 should equal the extracted price at index 1 within tolerance
    When I navigate to the scenario trip
    And I open flight details in cart
    Then the baggage "CHECKED BAG" should be displayed in flight details
