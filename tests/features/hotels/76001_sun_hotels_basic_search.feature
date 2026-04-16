@regression @provider:sun_hotels
Feature: 76001 Sun Hotels basic search flow

  Scenario: Search Sun Hotels and see room rates
    Given I am logged in as "marksunhot" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "MAD" for 1 night
    And I wait to see view rates text in results page
