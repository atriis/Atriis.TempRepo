@transportation @cars @regression @provider:galileo
Feature: 47577 - Galileo Car Results Display on Map for Enterprise Rental

  Scenario: Verify car results are displayed on map for enterprise rental agency
    Given I am logged in with a Galileo enterprise rental account
    When I search for cars
    Then the results should be displayed on the map
    And car locations should be marked on the map interface
