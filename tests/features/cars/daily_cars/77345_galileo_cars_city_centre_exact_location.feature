# ADO #77345 - Galileo - Cars - City Centre Exact Location
# Reference test case: ADO #77345
@daily_cars @provider:galileo @regression @transportation @cars @ado:77345 @priority:critical
Feature: 77345 Galileo - Cars - City Centre Exact Location
  As a corporate traveler using Galileo city center search
  I want location formatting to remain consistent from results to cart and booking
  So that I can confirm the exact pickup location before completing the trip

  Scenario Outline: Galileo city center location and address second line are consistent across booking flow
    Given I am logged in as "vinicius@bengalileo.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "<pickupLocation>" with rental agency "<agency>" and 1 months ahead
    And the agency station label should contain "<expectedLabel>" and address should contain "<expectedAddress>" on the vendor list
    And I select the city center pickup location by agency station label "<expectedLabel>" and address "<expectedAddress>"
    When I capture the "response" payload for request type "VehicleLocationReq" from Storage
    And the captured "response" payload for request type "VehicleLocationReq" should contain "<expectedAgencyStationRoad>".block("VehicleLocation")
    Then the captured "block" payload for request type "VehicleLocationReq" should contain "<expectedAgencyLocationType>".onKey("LocationType")
    And the captured "block" payload for request type "VehicleLocationReq" should contain "<expectedLabel>".map("<expectedAgencyLocationType>")
    And the car location label at index 0 should contain "<expectedLabel>" on results
    And the car city center address at index 0 should contain "<expectedAddress>" on results
    When I add a car from city center results to cart
    Then the car location label at index 0 should contain "<expectedLabel>" on cart
    And the car city center address at index 0 should contain "<expectedAddress>" on cart
    And the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the car location label at index 0 should contain "<expectedLabel>" on cart
    And the car city center address at index 0 should contain "<expectedAddress>" on cart
    And the booking status should be "Confirmed"
    And I successfully cancel the trip

    Examples:
      | pickupLocation         | agency      | expectedLabel           | expectedAgencyStationRoad | expectedAddress                         | expectedAgencyLocationType |
      | Barcelona,Spain,(BCN)  | Hertz       | Barcelona (City Center) | BARCELONA DIAGONAL-SARRIA |Barcelona Diagonal-sarria, Barcelona, ES | CityCenterDowntown         |
