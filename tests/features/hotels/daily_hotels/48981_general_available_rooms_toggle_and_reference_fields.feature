# Test Name: 48981 search for available rooms only
# Description: 
# Status: Active
# Labels: Hotel,Regression,Cart,results,search,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-10-15T02:12:37Z
# Updated: 2025-05-12T10:04:45Z

@regression @provider:general
Feature: 48981 Search for available rooms only
  As a corporate traveler
  I want to toggle "available rooms only" in search and fill reference fields
  So that only bookable rooms are shown and my booking references are recorded

  @priority:high
  Scenario: Available rooms only toggle works and reference fields are validated
    Given I am logged in as "shani_nl" booking a new trip
    And I have added myself as the traveler
    When I open the hotel search and verify available properties only is checked
    And I initiate a hotel search in "LON" for 1 night
    And I fill in NL reference fields education and courses
    And I wait for hotel results to load
    And I wait to see view rates text in results page
    When I edit the hotel search from results and verify available properties only is checked
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I edit the hotel search from cart and verify available properties only is checked
