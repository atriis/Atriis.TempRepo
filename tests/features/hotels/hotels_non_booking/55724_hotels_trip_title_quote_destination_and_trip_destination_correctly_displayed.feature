# Test Name: 55724 Only hotel in the trip- calculate the destination
# Description: 
# Status: Active
# Labels: Hotel,Regression,2026 plan 1
# Owner: pini harush
# Created: 2024-12-26T12:04:28Z
# Updated: 2026-01-06T09:25:43Z

@regression
Feature: 55724 Hotels - Trip title, quote destination and trip destination are correcly displayed
  As a corporate traveler
  I want the trip title and destination to be automatically set from the hotel I book
  So that my trip is properly labelled with the hotel's city

  @priority:medium
  Scenario: Trip title, quote destination and trip destination are correcly displayed
    Given I am logged in as "Bookingonly@Testim.corp" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "leonardo plasa ashdod" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the trip title should contain "Trip to Ashdod, IL"
    Then the quote destination should contain "1 Night at Ashdod, IL"
    Then the trip destination on top of the page should contain "Ashdod, IL"