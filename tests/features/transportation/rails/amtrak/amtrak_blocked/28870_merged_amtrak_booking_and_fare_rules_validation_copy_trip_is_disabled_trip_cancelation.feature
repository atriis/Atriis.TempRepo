# Test Name: 28870 MERGED Amtrak booking and fare rules validation, copy trip is disabled, trip cancelation
# Description:
# Status: Active
# Labels: Copy Trip,Fare Rules,Full Purchase,Pre Prod,Daily Transportation,Regression,Amtrak Sabre,Transportation,2026 plan 1
# Owner: Noam Miller
# Created: 2023-12-31T06:49:27Z
# Updated: 2026-02-11T05:31:45Z
@transportation @rails @amtrak @regression @priority:critical @full-purchase
Feature: 28870 Amtrak - Booking with fare rules validation, copy trip disabled and trip cancellation
  As a corporate traveler
  I want to book an Amtrak round trip, verify fare rules, confirm copy trip is disabled, and cancel with refund
  So that I can validate the full Amtrak booking lifecycle
  
  #Booking error, need to talk to Pedro
  Scenario: Amtrak round trip booking with fare rules, copy trip restriction and cancellation
    Given I am logged in as "alex@amtrakclub.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Amtrak train from "nypToWas"
    Then the fare rules should be accessible in Amtrak results and contain "Cancellations"
    And the fare rules should be accessible in Amtrak results and contain "Changes"
    And the fare rules should be accessible in Amtrak results and contain "Supplier Terms & Conditions"
    And I click select button in results
    Then the fare rules should be accessible in Amtrak results and contain "Cancellations"
    And the fare rules should be accessible in Amtrak results and contain "Changes"
    And the fare rules should be accessible in Amtrak results and contain "Supplier Terms & Conditions"
    And I click select button in results
    And I add the first result to trip
    And the booking status should be "Pending booking"
    Then the fare rules should be accessible in the Amtrak cart and contain "Cancellations"
    And the fare rules should be accessible in the Amtrak cart and contain "Changes"
    And the fare rules should be accessible in the Amtrak cart and contain "Supplier Terms & Conditions"
    When I fill in Amtrak contact information
    And the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    And the booking status should be "Ticketing Complete"
    Then the fare rules should be accessible in the Amtrak cart and contain "Cancellations"
    And the fare rules should be accessible in the Amtrak cart and contain "Changes"
    And the fare rules should be accessible in the Amtrak cart and contain "Supplier Terms & Conditions"
    Then the trip should not be eligible for copy trip
    And I successfully cancel the trip
