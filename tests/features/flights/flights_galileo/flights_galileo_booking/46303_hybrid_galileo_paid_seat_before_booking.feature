# Test Name: Hybrid for 46303: Galileo - Can reserve paid seat before booking
# Status: Active
# Labels: Galileo,BTP eBusiness,Seating,Flights,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2024-10-29T08:36:37Z
# Updated: 2026-02-16T11:51:37Z

@regression @galileo @flights @seating @hybrid
Feature: 46303 Galileo - Can reserve paid seat before booking

  As a corporate traveler
  I want to reserve a paid seat before completing the booking
  So that I can secure my preferred seat

  Scenario: Paid seat reservation before booking for multi-pax
    Given I am logged in as "shareQuote@btp.com" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "LHR" to "ATH" with preferred carrier "A3"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
    And I select the first available flight seat
    And I click next flight button
    And I select the first available flight seat
    And I save and close seat map drawer
    Then the booking status should be "Pending booking"
    And I click seating in extras
    And I click add seats in extras for traveler 2
    And I wait for the seat map to load
    And I select the first available flight seat
    And I click next flight button
    And I select the first available flight seat
    And I save and close seat map drawer
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    Then I successfully cancel the trip
