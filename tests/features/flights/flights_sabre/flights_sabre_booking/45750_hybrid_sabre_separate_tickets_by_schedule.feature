# Test Name: HYBRID for 45750 Sabre - Separate tickets - SegmentSelect Number="1" is not being sent twice
# Status: Active
# Labels: Regression,Sabre,Flights,separate tickets,hybrid,by schedule,2026 plan 2
# Owner: Bruna Santos
# Created: 2024-05-08T10:24:56Z
# Updated: 2025-12-16T09:02:17Z
#
# Separate tickets price each ticket in its own Sabre EnhancedAirBookRQ, each selecting its own PNR
# segments: <SegmentSelect Number="1"/> for one ticket and "2" for the next (or "1","2" then "3" when the
# first ticket is a connection). The bug sent Number="1" for both.
# Formerly checked by hand in the Logger; the payload step below replaces that manual part.

@regression @flights @sabre @separate-tickets @by-schedule @ado:45750
Feature: 45750 Sabre - Separate tickets - SegmentSelect Number="1" is not being sent twice
  As a corporate traveler
  I want to book separate ticket flights by schedule with different carriers
  So that the booking processes correctly without duplicate segment selection

  Scenario: Separate tickets are created correctly when booking by schedule with different carriers
    Given I am logged in as "brunasabre@froschbrunaautomation.com" booking a new trip
    And I have added a random guest traveler with phone type "Mobile"
    When I search for a flight by schedule from "AMS" to "FRA"
    And flight results should be available
    And I filter airline results by "Air France" checkbox
    When I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I filter results by carrier "Lufthansa"
    When I select one flight segment by schedule
    And I wait for "Your Selection" text to be visible
    Then the "Separated Tickets" indicator should be visible in the pricing page
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    And I accept Terms & Conditions
    And I hold the trip
    When I wait until "EnhancedAirBookRQ" requests have been sent for the trip
    Then the "EnhancedAirBookRQ" requests should select segment 1 and segment 2 in different tickets
