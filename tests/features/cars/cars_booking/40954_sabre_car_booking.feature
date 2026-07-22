# Test Name: 40954 Sabre car booking
# Description: 
# Status: Active
# Labels: Sabre,Cars,Full Purchase,No Amadeus Hotel Book,Regression,Sanity,Pre Prod,Club,Daily Transportation,progress page,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-01-07T05:46:40Z
# Updated: 2026-01-21T12:41:25Z
# ADO Test Case: #40954 - Sabre car booking
 
@transportation @cars @regression @provider:sabre @ado:40954 @booking
Feature: 40954 Sabre Car Booking Flow
  As a corporate traveler using Sabre
  I want to book cars through the Sabre provider

  @priority:critical
  Scenario: Add car and complete booking
    Given I am logged in as "robsoncruz@sabrecargdg.com" booking a new trip
    And I have added a random guest traveler
    When I search for a car at "LHR" with 1 months ahead
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip