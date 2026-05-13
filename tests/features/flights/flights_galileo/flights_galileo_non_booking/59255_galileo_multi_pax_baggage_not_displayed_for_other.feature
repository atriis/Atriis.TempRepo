# Test Name: 59255 Galileo - Multi pax - Baggage - Baggage is not displayed for the other traveller after saving baggage for only one traveller
# Status: Active
# Labels: Regression,Galileo,multi pax,baggage,Flights,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-12T07:47:15Z
# Updated: 2025-12-15T10:30:44Z

@regression @provider:galileo @flights @baggage @multi_pax @priority:high
Feature: 59255 Galileo - Baggage not displayed for other traveler after saving for one

  As a corporate traveler
  I want baggage to only appear for the traveler I saved it for
  So that baggage selections are correctly scoped per passenger

  Scenario: Baggage saved for one traveler is not displayed for the other
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a one way flight from "BRU" to "OTP"
    And flight results should be available
    And I filter results by carrier "RO"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit the baggage extras section
    And I click number of baggage
    And I click dropdown option "1st"
    And I click the save button
    Then I should see a success notification
    Then the booking status should be "Pending booking"
    And the baggage green icon should be visible
    When I click to edit the baggage extras section
    Then the baggage option "1st" should be saved
    And the baggage should not be displayed for traveler tab 2
