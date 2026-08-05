# Test Name: 69671 Sabre - can book 4 travelers in 2 rooms
# Description: 
# Status: Active
# Labels: Sabre,Hotel,Regression,Full Purchase,multi pax,Giata,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-11-02T05:24:13Z
# Updated: 2026-02-16T12:43:38Z

@regression @provider:sabre
Feature: 69671 Sabre - Book hotel for 4 travelers in 2 rooms with price match
  As a travel arranger
  I want to book a Sabre hotel for 4 travelers in 2 rooms
  So that all travelers are accommodated and the booking is confirmed

  @priority:critical
  Scenario: 4 travelers booked in 2 Sabre hotel rooms with confirmed status
    Given I am logged in as "sabrin@orly.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Maria Fernanda"
    And I have added traveler by name "James Douglas"
    And I have added a random guest traveler
    When I search for a hotel in "Paris France" for 1 night with 2 rooms
    And I wait to see view rates text in results page
    When I sort hotel results by "Price"
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the cart should show 2 rooms badge
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip with 60 seconds wait

