# Test Name: 86241 Fusion - Low-cost quote timer shows the real 15 minutes in half-hour time zones (Singapore, Kuala Lumpur, India)
# Status: Active
# Labels: Regression,Fusion,Flights,Time zone,Expiry
# Owner: Yael Alef
# Created: 2026-10-06

# ADO Test Case ID: 86241
# Source: ADO Bug #85928 - New UI low-cost quote timer shows 45 minutes instead of 15 on Singapore,
# Malaysia and India time zones
#
# The cart's timed-quote badge used to format the remaining milliseconds with date-fns format(ms, 'mm:ss'),
# which reads the number as a local time on 1970-01-01. In 1970 Singapore and Kuala Lumpur were UTC+07:30
# and India UTC+05:30, so the half hour was added to the minutes: 14:44 left showed as 44:44. Each
# @timezone tag opens the browser in that zone, which replaces the manual "change the Windows time zone"
# step. A 13-15 minute window fails on the old 43-45 reading. Sofia is the whole-hour control.

@regression @flights @fusion @lcc @expiry
Feature: 86241 Fusion - Low-cost quote timer is correct in half-hour time zones
  As a traveller whose computer is set to a Singapore, Malaysia or India time zone
  I want the low-cost quote timer to show the real time left to book
  So that I am not told I have 45 minutes when the quote expires after 15

  @timezone:Asia/Singapore
  Scenario: Fusion low-cost quote timer starts at about 15 minutes in Asia/Singapore
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    And flight results should be available
    And I filter airline results by "EasyJet" checkbox
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And the timed quote badge should be visible in cart
    And the countdown clock is between 13 and 15 minutes

  @timezone:Asia/Kolkata
  Scenario: Fusion low-cost quote timer starts at about 15 minutes in Asia/Kolkata
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    And flight results should be available
    And I filter airline results by "EasyJet" checkbox
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And the timed quote badge should be visible in cart
    And the countdown clock is between 13 and 15 minutes

  @timezone:Europe/Sofia
  Scenario: Fusion low-cost quote timer starts at about 15 minutes in a whole-hour zone (control)
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    And flight results should be available
    And I filter airline results by "EasyJet" checkbox
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And the timed quote badge should be visible in cart
    And the countdown clock is between 13 and 15 minutes
