# Test Name: 35792 OOP for hotel cost does not appear in the cart because hotel cost is in policy
# Description:
# Status: Active
# Labels: Hotel,Regression,Travel policy,v3,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-09-14T10:37:35Z
# Updated: 2024-12-26T11:46:54Z

@regression @travel_policy @hotel @provider:amadeus_value_hotel
Feature: 35792 Travel Policy - Hotel cost in policy does not trigger OOP in cart
  As a corporate traveler
  I want to see no OOP indicator when the hotel cost is within policy limits
  So that I can book without needing justification

  Scenario: Hotel within cost policy does not show OOP in cart
    Given I am logged in as "value@policy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I wait to see view rates text in results page
    Then only the hotels priced at or above 745 should be out of policy
    When I select the hotel priced closest below 745
    And I wait for the first add to trip button to be visible in room level results
    Then the room priced closest below 745 should not be out of policy in room level
    When I add the room priced closest below 745 to my cart
    Then the booking status should be "Pending booking"
    Then the out of policy indicator should not be visible in cart
