# Test Name: 55724 Only hotel in the trip- calculate the destination
# Description: 
# Status: Active
# Labels: Amadeus,Hotel,Regression,2026 plan 1
# Owner: pini harush
# Created: 2024-12-26T12:04:28Z
# Updated: 2026-01-06T09:25:43Z

@regression @provider:amadeus
Feature: 55724 Hotels - Trip title, quote destination and trip destination are correcly displayed
  As a corporate traveler
  I want the trip title and destination to be automatically set from the hotel I book
  So that my trip is properly labelled with the hotel's city

  @priority:medium
  Scenario: Trip title, quote destination and trip destination are correcly displayed
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Leonardo Plana Ashdod" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the trip title should contain "Trip to Ashdod, IL"
    Then the quote destination should contain "1 Night at Ashdod, IL"
    Then the trip destination on top of the page should contain "Ashdod, IL"