# Test Name: 73594 Amadeus - number of characters for special request should be up to 120
# Description: 
# Status: Active
# Labels: Regression,Amadeus,No Amadeus Hotel Book,Cart,special request,Hotel
# Owner: Shani Hadar
# Created: 2026-02-11T08:58:38Z
# Updated: 2026-02-16T12:19:54Z

@regression @provider:amadeus
Feature: 73594 Amadeus - Special request 120 character limit for Amadeus hotels
  As a corporate traveler booking an Amadeus hotel
  I want to add a special request up to 120 characters
  So that hotel-specific special requests can be submitted within the allowed limit

  @priority:medium
  Scenario: Special request field accepts up to 120 characters for Amadeus hotels
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I add a special request text of 120 characters
    Then the special request should be truncated to 120 characters
