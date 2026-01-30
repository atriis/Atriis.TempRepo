@regression
Feature: Hotel Share Quote and Itinerary
  As a corporate traveler
  I want to share hotel quotes and itineraries
  So that colleagues can review my booking options

  @priority:critical
  Scenario: Share hotel quote from cart
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I select the first available hotel
    And I add a refundable room to my cart
    And I click the share quote button
    And I send the share
    Then I should see a success notification

  @priority:critical
  Scenario: Share hotel itinerary from cart
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I select the first available hotel
    And I add a refundable room to my cart
    And I click the share itinerary button
    And I send the share
    Then I should see a success notification