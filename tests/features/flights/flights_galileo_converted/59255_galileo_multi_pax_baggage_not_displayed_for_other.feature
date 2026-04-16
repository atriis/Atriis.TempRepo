# Test Name: 59255 Galileo - Multi pax - Baggage - Baggage is not displayed for the other traveller after saving baggage for only one traveller
# Status: Active
# Labels: Regression,Galileo,multi pax,baggage,Flights,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-12T07:47:15Z
# Updated: 2025-12-15T10:30:44Z

@regression @galileo @flights @baggage @multi_pax
Feature: 59255 Galileo - Baggage not displayed for other traveler after saving for one

  As a corporate traveler
  I want baggage to only appear for the traveler I saved it for
  So that baggage selections are correctly scoped per passenger

  Scenario: Baggage saved for one traveler is not displayed for the other
    Given I am logged in as "beatrizpamplonacorp" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    # TODO: Inline actions to open advanced search, select nonstop, add preferred carrier "tarom"
    # Testim: click tab-flight, click nonstop, search preferred carrier "tarom"
    When I search for a one way flight from "BRU" to "OTP"
    And I wait for flight results to be available
    And I filter results by carrier "RO"
    And I add the first flight to cart
    # TODO: Expand baggage section, select baggage for first traveler, save, verify success
    # Then switch to second traveler tab and verify no baggage is displayed
    # Testim: click ".flight-baggage .is-clickable" → select dropdown → save → switch tab → negative validation
