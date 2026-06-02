# Test Name: 35792 OOP for hotel cost does not appear in the cart because hotel cost is in policy
# Description:
# Status: Active
# Labels: Hotel,Regression,Travel policy,v3,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-09-14T10:37:35Z
# Updated: 2024-12-26T11:46:54Z

@regression @travel_policy @hotel @shell
Feature: 35792 Travel Policy - Hotel cost in policy does not trigger OOP in cart

  As a corporate traveler
  I want to see no OOP indicator when the hotel cost is within policy limits
  So that I can book without needing justification

  Scenario: Hotel within cost policy does not show OOP in cart
    Given I am logged in as "didoribeira@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "ibis Styles London Heathrow Airport, Bath Road, London, UK" for 1 night(s)
    And I wait to see view rates text in results page
    And I sort hotel results by "Price - Low to High"
    And I select the first hotel result
    And I add the first available room to my cart
    Then the out of policy indicator should not be visible in cart
