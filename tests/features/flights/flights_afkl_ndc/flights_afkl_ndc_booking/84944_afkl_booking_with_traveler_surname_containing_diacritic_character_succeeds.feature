# Test Name: 84944 AFKL NDC - Booking with traveler surname containing diacritic character succeeds
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,Diacritic,Traveler Name,Full Purchase
# Owner: Bruna Santos

# ADO Test Case ID: 84944
@ado:84944 @regression @flights @afkl @baggage
Feature: 84944 AFKL NDC - Booking with traveler surname containing diacritic character succeeds
  As a corporate traveler
  I want to book a AFKL flight with a traveler surname containg diacritic character
  So that the booking succeeds

  Scenario: Booking with traveler surname containing diacritic character succeeds
    Given I am logged in as "brunaafkl@afklbrunaamsalem.com" booking a new trip
    And I have added traveler by name "Ramos García"
    When I search for a round trip flight from "BCN" to "CDG"
    And I click to open first pricing options
    And I select the pricing option containing "1PC"
    And I should see the heading "Flight To Barcelona"
    And I select the pricing option containing "1PC"
    And I add to trip from pricing options
    And the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Ticketing Complete"
    And all quotes should have PNR codes
