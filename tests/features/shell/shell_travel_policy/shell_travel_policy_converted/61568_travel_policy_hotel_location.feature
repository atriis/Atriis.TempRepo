# Test Name: 61568 Travel Policy - 'Hotel Location' policy is correctly triggered
# Description:
# Status: Active
# Labels: Travel policy,Regression,Booking.com,Hotel,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-02T05:15:56Z
# Updated: 2025-05-02T05:48:56Z

@regression @travel_policy @hotel @shell
Feature: 61568 Travel Policy - Hotel location policy is correctly triggered

  As a corporate traveler
  I want the hotel location policy to not trigger OOP for allowed locations
  So that I can book hotels in permitted areas without justification

  Scenario: Hotel in Pino Alto Spain does not trigger OOP location policy
    Given I am logged in as "tata@travelpolicy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Pino Alto, Spain" for 1 night(s)
    And I wait to see view rates text in results page
    And I sort hotel results by "Price - Low to High"
    And I select the first hotel result
    # TODO: Verify OOP badge is NOT visible at room level
    When I add the first available room to my cart
    Then the out of policy indicator should not be visible in cart
