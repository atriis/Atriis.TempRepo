@transportation @cars @regression
Feature: 67021 - City Center Search Stations Status

  Scenario: Verify stations status display is correct in city center search
    Given I am logged in
    When I search for cars in city center
    Then the stations should be displayed with correct status information
    And status indicators should be visible
