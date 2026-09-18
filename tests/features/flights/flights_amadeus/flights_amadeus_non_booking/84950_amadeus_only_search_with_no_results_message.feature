@regression @flights @amadeus 
Feature: 84950 Amadeus - Only Search With - No results message is displayed when the configured carrier does not fly the route

  As a corporate traveler on the only search with configuration
  I want to see the no results message when my search returns nothing
  So that I know the route is unavailable for my profile

  Scenario: No results message is displayed when the configured carrier does not fly the route
    Given I am logged in as "oliverama@amsalembrunaspecific.com" booking a new trip
    And I have added myself as the traveler
    # Configured to "Only Search With Ryanair", so I cannot see other results.
    # But since Ryanair does not flight these route, no results should be displayed.
    When I search for a round trip flight from "BRU" to "OSL"
    Then the no results found message should be displayed
