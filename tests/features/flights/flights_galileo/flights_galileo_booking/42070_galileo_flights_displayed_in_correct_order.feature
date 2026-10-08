# Test Name: 42070 Galileo - Flights are displayed in correct order
# Status: Active
# Labels: Regression,Galileo,Flights,progress page,Cancel by process,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-01-18T05:13:21Z
# Updated: 2026-10-08

# Bug: on a multi-city trip whose second leg departs the same day the first one lands (HKG-LAX then
# LAX-LAS), the cart listed LAX-LAS above HKG-LAX, so a flight appeared to depart before the flight
# feeding it had landed. The rows are ordered by local clock time, so it only shows when the LAX
# departure reads EARLIER than the HKG one — a late-evening HKG departure (e.g. 22:45) lands at LAX
# the same evening and connects to LAS before 22:45 on the clock. Filtered by time, not flight
# number, because flight numbers change from date to date.
@regression @galileo @flights @full_purchase @multi_city @hold
Feature: 42070 Galileo - Flights are displayed in correct order

  As a corporate traveler
  I want my flights listed in the order I fly them
  So that I can read my itinerary correctly

  Scenario: Multi-city flights stay in travel order in cart, flight details and after hold
    Given I am logged in as "m29@edifact.reg" booking a new trip
    And I have added a random guest traveler
    When I search for a multi-city flight with legs "HKG-LAX, LAX-LAS, LAS-HKG" departing in "29, 29, 43" days
    And flight results should be available
    And I filter airline results by "United" checkbox
    And I set the "Depart from Hong Kong" time filter to start at "21:00"
    And flight results should be available
    And I select the first flight result in new flight flow
    And I select the first option from pricing options
    And I select the first option from pricing options
    And I select the first option from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending Booking"
    And the cart flights should be displayed in travel order
    When I open flight details in cart
    Then the flight details flights should be displayed in travel order
    And I close more details in cart
    When I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    And the cart flights should be displayed in travel order
    And I successfully cancel the trip with 60 seconds wait
