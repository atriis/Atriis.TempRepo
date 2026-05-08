@transportation @cars @avis @regression
Feature: Avis arrival flight info mandatory for specific locations
  As a user booking an Avis rental car
  I want to provide arrival flight information when booking from specific locations
  So that the rental agency can coordinate my pickup properly

  Background:
    Given I navigate to the application
    And I am logged in as "carCorp@gdg.com"

  @avis @flight-info @mandatory
  Scenario: Require flight info when booking Avis car with direct search
    When I start a new trip
    And I add myself as a traveler
    And I search for a car at "CVG" with "Avis" rental agency
    And I select the first available Avis car to add to trip
    Then the car should be added with "Pending booking" status
    And the flight information section should display as required
    When I enter the arrival flight number "UA086"
    And I accept the flight information
    And I confirm the booking
    Then the booking should be successfully completed

  @avis @flight-info @from-flight-booking
  Scenario: Validate flight info parsed from existing flight booking for Avis rental
    When I start a new trip
    And I add a random traveler to the trip
    And I search for flights from "SJC" to "PHX"
    And I select the first available flight and add to trip
    Then the flight should be added with "Pending booking" status
    When I navigate to the Cars section
    And I search for "Avis" rental cars
    And I select the first available Avis car to add to trip
    Then the car should be added with "Pending booking" status
    And the flight information section should display the parsed flight number
    And the flight information section should be expandable
    When I expand the flight information section
    Then the arrival flight details should be visible and confirmed
    When I accept the terms and conditions
    And I confirm the booking
    Then the booking should be successfully processed
    And the system should show "finalizing" status
    And I cancel the trip
    Then the trip should be successfully cancelled
