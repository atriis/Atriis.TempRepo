# Test Name: 78227 General - Hotel results filtered by Pet Friendly amenity
# Description: Verify that clicking the Pet Friendly amenity filter on hotel level results
#              narrows the hotel list and the active filter tag appears.
# Status: Active
# Labels: Hotel,Amenities,Filter,results,Regression,2026 plan 2
# Owner: Yael

@regression @hotel @amenities
Feature: 78227 General - Hotel results can be filtered by Pet Friendly amenity
  As a corporate traveler
  I want to filter hotel search results by the Pet Friendly amenity
  So that only pet-friendly hotels are shown in the results list

  @priority:medium
  Scenario: Pet Friendly amenity filter narrows hotel results in London
    Given I am logged in as "Amenities@Amenities.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a hotel search in "London" for 1 night
    And I select the trip purpose as "BILLABLE" and proceed
    And I wait to see view rates text in results page
    When I apply hotel level filter "Amenities" with option "Pet Friendly"
    Then the "Pet Friendly" filter tag should be visible in hotel results
    Then "Hotel wasn't found" error message is not displayed
