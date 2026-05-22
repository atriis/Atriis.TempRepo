# Test Name: 72577: Amadeus Light Ticketing - Booking is ticketed when sent for approval
# Description:
# Status: Active
# Labels: Amadeus Light Ticketing,Approval flow,Amsalem,Flights,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-05-18T02:24:29Z
# Updated: 2026-01-19T12:53:05Z

@regression @flights @amadeus @light-ticketing @approval
Feature: 72577 Amadeus Light Ticketing - Booking ticketed on approval
  As a corporate traveler
  I want my light ticketing booking to be ticketed when sent for approval
  So that the booking is automatically ticketed after approval flow

  Scenario: Ryanair booking is ticketed when sent for approval
    Given I am logged in as "ryanAir@amadeus.ams" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "STN" to "BCN" with preferred carrier "Ryanair"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I fill credit card cvv if needed
    And I proceed to checkout
    And I send booking for approval
    And the trip status should be "In Approval"
    Then the booking status should be "Ticketing Complete"
    
