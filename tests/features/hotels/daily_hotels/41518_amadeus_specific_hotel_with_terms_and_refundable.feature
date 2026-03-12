# Test Name: 41518 Amadeus - "Intercontinental Ljubljana" hotel terms and conditions are available and it is possible to add it to cart
# Description: 
# Status: Active
# Labels: Regression,Amadeus,Hotel,Terms and Conditions,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-01-19T10:38:37Z
# Updated: 2025-07-16T12:59:30Z

@regression @provider:amadeus
Feature: 41518 Amadeus - "Intercontinental Ljubljana" hotel terms and conditions are available and it is possible to add it to cart
  As a corporate traveler
  I want to filter for a specific hotel, check terms, add it and verify it's refundable in cart
  So that I can confirm the cancellation policy before committing to a booking

  @priority:critical
  Scenario: "Intercontinental Ljubljana" hotel terms and conditions are available and it is possible to add it to cart
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Intercontinental Ljubljana" for 1 night
    And I wait to see view rates text in results page
    And I filter hotel results by hotel name "Intercontinental Ljubljana"
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    When I check terms and conditions in room level
    Then terms and conditions are displayed
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the hotel should appear as refundable in cart
