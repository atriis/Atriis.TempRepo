@transportation @cars @regression @provider:sunnycars
Feature: City Center Search - Verify station status

  As a traveler
  I want to search for city center car rental locations
  So that I can verify the status of rental stations

  Scenario: Search for city center cars in Barcelona and verify station status
    Given I am logged in as "kaylesun"
    When I book a new trip
    And I add myself as the traveler
    And I search for city center cars in "Barcelona, Spain, (BCN)"
    And I answer reference fields with "Chris Tree Fake Test" and proceed
    Then I should be able to verify station status information
