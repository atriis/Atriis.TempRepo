# ADO Bug #74652 - Sunny Cars // Car model not mentioned in new UI
# Regression: Car model name must be visible in search results when searching via Sunny Cars supplier.

@regression @provider:sunnycars @cars @bug:74652
Feature: 74652 Sunny Cars - Car Model Visibility in Search Results
  As a corporate traveler using Sunny Cars
  I want to see the car model name in the search results
  So that I can identify and compare available vehicles before booking

  @priority:critical
  Scenario: Car model name is visible in Sunny Cars search results at LHR
    Given I am logged in as "sunnycar" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Sunny Cars" and 1 months ahead
    Then the car model should be visible in the results
