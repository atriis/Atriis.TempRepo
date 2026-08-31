# Test Name: 55166 Amadeus hotel - can edit loyalty number after checkout
# Description: 
# Status: Active
# Labels: Hotel loyalty number,Regression,Amadeus,Full Purchase,Hotel,progress page,2026 plan 2
# Owner: Shani Hadar
# Created: 2024-12-08T05:24:02Z
# Updated: 2025-09-17T12:25:52Z

@regression @provider:amadeus
Feature: 55166 Amadeus - Loyalty number can be edited after hotel checkout
  As a corporate traveler
  I want to add or edit my loyalty number after completing an Amadeus hotel checkout
  So that my loyalty points are tracked even if I enter the number after booking

  @priority:medium
  Scenario: Loyalty number can be added or edited on the confirmed booking page
    Given I am logged in as "amy@loyal.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    And I wait to see view rates text in results page
    When I sort hotel results by "Price"
    And I select the first hotel result
    And I add a refundable room to my cart
    And I log the trip number from the URL
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    When I click the extras arrow button
    And I add loyalty number "565656" using the first available chain
    And I capture the "request" payload for request type "Amadeus4.Command_Cryptic (Update Frequent Program)" from Storage
    Then the captured "request" payload for request type "Amadeus4.Command_Cryptic (Update Frequent Program)" should contain the XML:
      """
					<textStringDetails>2/ID-565656</textStringDetails>
      """
    And I successfully cancel the trip