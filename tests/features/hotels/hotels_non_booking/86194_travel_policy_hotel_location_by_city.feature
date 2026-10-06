@regression @travel_policy @hotel @provider:bookingcom
Feature: 86194 Travel Policy - Hotel location policy by city is correctly triggered
  As a corporate traveler
  I want the hotel location policy to trigger OOP for not allowed cities
  So that I will not book hotels in not permitted areas without justification

  Scenario: Hotel triggers OOP location policy by city
    Given I am logged in as "tata@travelpolicy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "amsterdam netherlands" for 1 night
    And I wait to see view rates text in results page
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Hotel location is amsterdam, netherlands (ams)"
    When I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Hotel location is amsterdam, netherlands (ams)"
    When I add a refundable room to my cart
    Then the out of policy indicator should be visible in cart
    And the OOP policy reason should be "Hotel location is amsterdam, netherlands (ams)"
