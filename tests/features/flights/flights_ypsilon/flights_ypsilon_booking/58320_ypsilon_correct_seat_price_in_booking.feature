# Test Name: 58320 Ypsilon - Correct seat price is passed in booking request
# Description:
# Status: Active
# Labels: Ypsilon,Flights,Seating,Regression,Full Purchase,progress page,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-13T07:05:30Z
# Updated: 2025-10-16T02:13:55Z

@regression @flights @ypsilon @seating @full-purchase
Feature: 58320 Ypsilon - Correct seat price is passed in booking request
  As a corporate traveler using Ypsilon
  I want the correct seat price to be included when booking
  So that the seat selection cost is accurately reflected in the booking

  Scenario: Seat price is correctly passed during booking
    Given I am logged in as "gabitom@ypsilondisplaycurrency.com" booking a new trip
    And I have added a random guest traveler
    # Any carrier with a seat map will do. The default search date has hit dates where Ypsilon
    # staging returns no fares at all (cntTarifs="0"); 30 days out has content.
    When I search for a one way flight from "LON" to "DUB" in 30 days
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    And I select card 1 and save
    When I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
    And I select the first available flight seat
    And I save and close seat map drawer
    And the booking status should be "Pending booking"
    Then the yellow seat indicator should be visible after saving seats
    When I proceed to checkout
    And I complete the booking with Ypsilon credit card verification
    Then the booking status should be "Ticketing Complete"
    # The user's display currency is EUR, so the seat map answers each seat in two currencies:
    # currencyType="default" (what Ypsilon charges) and currencyType="agency" (EUR). The seat
    # must be booked in the default one.
    When I capture the "response" payload for request type "SeatMap" from Storage
    # Each SeatMap call is logged twice and one twin's response is only "Only request xmlNoCC is
    # null"; this assertion's multi-match fallback re-pins the capture on the real seat map.
    Then the captured "response" payload for request type "SeatMap" should contain "seatPrice"
    And I store the XML attribute "currency" of the first "seatPrice" element whose "currencyType" is "default" in the captured "response" payload for request type "SeatMap" as "seatDefaultCurrency"
    And I capture the "request" payload for request type "Booking" from Storage
    # The app's own booking API call is logged as "Booking" too; re-pin on the Ypsilon bookingRequest.
    Then the captured "request" payload for request type "Booking" should contain "specialServices"
    Then in the captured "request" payload for request type "Booking", every "specialServices" element should have XML attribute "currency" equal to "{seatDefaultCurrency}"
