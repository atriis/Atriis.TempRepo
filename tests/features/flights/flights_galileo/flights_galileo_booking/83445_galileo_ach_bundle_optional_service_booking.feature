# Test Name: 82732 Galileo ACH - Booking with bundle optional service is successful
# Status: Active
# Labels: Regression,Galileo,Ryanair,Travelport ACH,Optional Services,Full Purchase,2026 plan 2
# Owner: Noam Miller
# Created: 2026-08-26
# Updated: 2026-08-26

# ADO Bug: 82732
@ado:83445
@regression @provider:galileo @flights @ryanair @optional-services @full-purchase @priority:high
Feature: 83445 Galileo ACH - Booking with bundle optional service is successful

  As a corporate traveler booking a Ryanair flight served by Travelport ACH
  I want to add the "Bundle - Plus fare" optional service and complete the booking
  So that the booking request is built and sent instead of crashing before it leaves Atriis

  # No cancel step: an ACH booking cannot be cancelled by the automation, so this
  # scenario deliberately leaves a live booked trip behind.
  Scenario: Ryanair booking with "Bundle - Plus fare" selected completes and returns a PNR
    Given I am logged in as "ach@bundled.gdg" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "DUB" to "GLA" with outbound in 21 days and return in 24 days
    Then flight results should be available
    When I filter airline results by "Ryanair" checkbox
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click optional services in extras
    And I select the "Bundle - Plus fare" optional service
    And I click the save button
    Then the optional services green icon should be visible
    Then the payment type should be "Paid by TMC"
    When I fill the credit card CVV
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Finalising"
    And all quotes should have PNR codes
