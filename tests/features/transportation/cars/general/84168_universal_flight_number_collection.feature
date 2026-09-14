# ADO User Story: #78273 - Universal Flight Number Collection (All Distributors) (US-001)
# ADO Test Case: #84168
# Related: US-002 flight-matching logic (#78274)
@transportation @cars @regression @ado:78273
Feature: 84168 Universal Flight Number Collection (All Distributors)
  As a car rental supplier
  I want to receive the traveler's flight number regardless of which distributor books the car
  So that vehicles are ready when travelers arrive

  @priority:high @tc:84168
  Scenario: Flight number field displays as optional at an airport rental station
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "Mexico City Intl. (MEX), Mexico City, Distrito Federal, Mexico" with rental agency "Sixt"
    And I add the first car to cart
    Then the flight number field should be displayed as optional

  @priority:high @tc:84168
  Scenario: Flight number field displays as optional when the trip has a flight segment
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MAD" to "LHR" with parallel car search
    And I add the first result to trip
    And I add the first car to cart
    Then the flight number field should be displayed as optional

  @priority:high @tc:84168
  Scenario: Flight number field is mandatory for Avis at an Avis-mandatory airport
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "Mexico City Intl. (MEX), Mexico City, Distrito Federal, Mexico" with rental agency "Avis (ZI)"
    And I add the first car to cart
    Then the flight number field should be displayed as mandatory
    And the flight number disclaimer should read "This car rental company requires your flight number to have your vehicle ready when you arrive."

  @priority:high @tc:84168
  Scenario: Flight number field does not display when neither condition is met
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "MAD" with rental agency "Alamo"
    When I select the first city center pickup location
    And I add the first car to cart
    Then the flight number field should not be displayed

  @priority:high @tc:84168
  Scenario: Flight number field auto-populates with the best-matching flight
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MAD" to "LHR" with parallel car search
    And I add the first result to trip
    And I add the first car to cart
    Then the flight number field should be auto-populated with the matching flight number

  @priority:medium @tc:84168
  Scenario: Manually edited flight number is retained and not overwritten
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MAD" to "LHR" with parallel car search
    And I add the first result to trip
    And I add the first car to cart
    And I edit the flight number to "AB6548"
    Then the flight number field should still show "AB6548"

  @priority:medium @tc:84168
  Scenario: Flight number field stays empty and optional with no matching flight segment
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "Mexico City Intl. (MEX), Mexico City, Distrito Federal, Mexico" with rental agency "Sixt"
    And I add the first car to cart
    Then the flight number field should be empty and optional

  @priority:low @tc:84168
  Scenario: Standard disclaimer text is shown at a non-Avis-mandatory location
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "Mexico City Intl. (MEX), Mexico City, Distrito Federal, Mexico" with rental agency "Sixt"
    And I add the first car to cart
    Then the flight number disclaimer should read "We'll share your flight details with the car rental company so your vehicle is ready when you arrive."

  @priority:high @tc:84168
  Scenario: Avis-specific disclaimer text is shown at an Avis-mandatory airport
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "Mexico City Intl. (MEX), Mexico City, Distrito Federal, Mexico" with rental agency "Avis (ZI)"
    And I add the first car to cart
    Then the flight number disclaimer should read "This car rental company requires your flight number to have your vehicle ready when you arrive."

  @priority:critical @tc:84168
  Scenario: Invalid flight number format blocks booking with a validation error
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "Mexico City Intl. (MEX), Mexico City, Distrito Federal, Mexico" with rental agency "Avis (ZI)"
    And I add the first car to cart
    And I enter flight number "AB654865"
    Then the flight number validation error should read "Flight number must start with a 2-3 character airline code (at least one letter) followed by 1-4 digits, e.g. AB123."
    And the booking should be blocked
