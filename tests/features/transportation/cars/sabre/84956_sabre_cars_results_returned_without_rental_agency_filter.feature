# ADO Test Case: #84956 - Sabre - Cars - Results are returned when searching for specific without rental agency filter

@transportation @cars @regression @provider:sabre @ado:84956
Feature: 84956 Sabre - Cars - Results are returned when searching for specific without rental agency filter
  As a traveler searching a city center car location
  I want results to be returned without applying a rental agency filter
  So that I can pick a station from the unfiltered pick-up location list

  Scenario: Search Gare de Lyon city center and verify the first station is selectable
    Given I am logged in as "robsoncruz@sabrecargdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "Gare de Lyon, Paris, France"
    Then the first station should have a "Select" button
