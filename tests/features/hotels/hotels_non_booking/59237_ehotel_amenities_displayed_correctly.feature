# Test Name: 59237 ehotel - see amenities according to the log
# Description: 
# Status: Active
# Labels: Ehotel Regression,No Amadeus Hotel Book,Hotel,Amenities,results,Results page hotel,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-07-13T10:43:06Z
# Updated: 2025-07-13T10:57:36Z

@regression @provider:ehotel
Feature: 59237 eHotel - Hotel amenities displayed correctly according to supplier data
  As a corporate traveler using eHotel
  I want to see the correct amenities for each hotel in search results
  So that hotels with gym are shown with the gym amenity and hotels without are not

  @priority:medium
  Scenario: Amenities are shown correctly - with gym and without gym
    Given I am logged in as "eli@tel.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I wait to see view rates text in results page
    Then hotel 1 should display the "Gym" amenity
    When I sort hotel results by "Price"
    And I capture the "response" payload for request type "hotelDescriptiveInfo" from Storage
    Then the captured "response" payload for request type "hotelDescriptiveInfo" should contain either '<ota:Service Code="006.EHO">' or '<ota:Service Code="35">'
    When I note the time before new payload requests are sent
    Then hotel 1 should not display the "Gym" amenity
    And I log the trip number from the URL
    When I capture the latest "response" payload for request type "hotelDescriptiveInfo" sent since the noted time from Storage
    Then the captured "response" payload for request type "hotelDescriptiveInfo" should not contain '<ota:Service Code="006.EHO">'
    And the captured "response" payload for request type "hotelDescriptiveInfo" should not contain '<ota:Service Code="35">'
