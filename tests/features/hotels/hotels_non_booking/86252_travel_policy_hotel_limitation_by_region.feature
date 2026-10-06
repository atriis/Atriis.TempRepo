@regression @travel_policy @hotel_limitation @hotel @provider:ehotel
Feature: 86252 Travel Policy - Hotel limitation policy by region is correctly triggered
  As a corporate traveler
  I want the hotel limitation policy to trigger OOP for not allowed regions
  So that I will not book hotels in not permitted areas without justification

  Scenario: Hotel triggers OOP limitation policy by region
    Given I am logged in as "limitation@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "paris" for 1 night
    And I wait to see view rates text in results page
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Limitation country state region is violated 2 USD in Europe"
    When I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Limitation country state region is violated 2 USD in Europe"
    When I add a refundable room to my cart
    Then the out of policy indicator should be visible in cart
    And the out of policy violations in cart should include "Limitation country state region is violated 2 USD in Europe"
