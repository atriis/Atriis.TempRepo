# Test Name: HYBRID for 45741 Amadeus - CTCE and CTCM are being sent when booking and the format is correct
# Status: Active
# Labels: Regression,Amadeus,Flights,hybrid,contact info,tripstatus,progress page,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2024-05-08T09:40:55Z
#
# The booking must send the traveller's contact to Amadeus in PNR_AddMultiElements:
# - CTCE: the email with "//" in place of "@" (e.g. JOHN.DOE123//ATRIISTESTAUTOMATION.COM)
# - CTCM: the mobile as digits only, without hyphens (e.g. 2225551234)
# Formerly checked by hand in the Logger; the payload step below replaces that manual part.
# "Don't share the contact details with airlines" defaults from the profile; when it is checked
# the booking sends CTCR REFUSED instead, so the scenario unchecks it explicitly.

@regression @amadeus @flights @contact_info @full-purchase @ado:45741
Feature: 45741 Amadeus - CTCE and CTCM sent when booking
  As a corporate traveler
  I want to book a round trip flight
  So that CTCE and CTCM information is sent correctly during booking

  Scenario: Booking a round trip flight sends CTCE and CTCM in the correct format
    Given I am logged in as "brunasantosnl@testim.com" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "LIS" to "NYC"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I add a credit card as payment method
    When I proceed to checkout
    Then the contact email on checkout should contain "@atriis"
    And I share the contact details with airlines in checkout
    And I complete the booking
    Then the booking status should be "Finalising"
    When I wait until "Amadeus4.PNR_AddMultiElements" requests have been sent for the trip
    Then the "Amadeus4.PNR_AddMultiElements" request should send the guest traveler's email as CTCE and their phone as CTCM digits only
    And I attempt to cancel the trip safely
