# Test Name: HYBRID for 61652 expedia - send the traveler's phone in case valid, and the user group's phone in case not valid
# Description: 
# Status: Active
# Labels: Expedia,Hotel,Regression,traveler,hybrid,phone number,progress page,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-05-06T01:09:57Z
# Updated: 2025-07-10T04:55:01Z

@regression @provider:expedia
Feature: 61652 HYBRID Expedia - Send the traveler's phone in case valid, and the user group's phone in case not valid
  As a corporate traveler whose phone number may be invalid
  I want the system to fall back to the user group's phone number when the traveler's phone is invalid
  So that hotel bookings always have a valid phone number submitted

  @priority:medium
  Scenario: Trip 1 - Traveler with invalid phone - We send the user group's phone
    Given I am logged in as "shani_nl" booking a new trip
    And I have added traveler by name "inbal idfon"
    When I search for a hotel in "LON" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the hotel should appear as refundable in cart
    And I fill credit card cvv if needed
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip

  @priority:medium
  Scenario: Trip 2 - Traveler with valid phone - We send the traveler's phone
    Given I am logged in as "shani_nl" booking a new trip
    And I have added traveler by name "valeria fone"
    When I search for a hotel in "LON" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the hotel should appear as refundable in cart
    And I fill credit card cvv if needed
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip
    
