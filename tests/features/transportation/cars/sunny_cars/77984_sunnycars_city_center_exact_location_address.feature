# ADO #77984 - SunnyCars - Cars - City Centre Exact Location
# Reference test case: ADO #77984

@daily_cars @provider:sunnycars @regression @transportation @cars @ado:77984 @full_purchase
Feature: 77984 SunnyCars - Cars - City Centre Exact Location
  As a corporate traveler using SunnyCars city center search
  I want location formatting to remain consistent from results to cart and booking
  So that I can confirm the exact pickup location before completing the trip

  Scenario Outline: SunnyCars city center location and address second line are consistent across booking flow
    Given I am logged in as "automation@sunnycar.gdg" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "<pickupLocation>" with rental agency "<agency>" and 1 months ahead
    And the agency station label should contain "<expectedAgencyStationLabel>" and address should contain "<expectedAgencyStationAddress>" on the vendor list
    And I select the city center pickup location by agency station label "<expectedAgencyStationLabel>" and address "<expectedAgencyStationAddress>"
    When I capture the "response" payload for request type "GetRegionsWithLocationsP9" from Storage
    And the captured "response" payload for request type "GetRegionsWithLocationsP9" should contain "<expectedAgencyStationRoad>".block("Locations")
    Then the captured "block" payload for request type "GetRegionsWithLocationsP9" should contain "<expectedAgencyLocationType>".onKey("LocationType")
    And the captured "block" payload for request type "GetRegionsWithLocationsP9" should contain "<expectedAgencyStationLabel>".map("<expectedAgencyLocationType>")
    And the car location label at index 0 should contain "<expectedLabelOnResults>" on results
    And the car city center address at index 0 should contain "<expectedAddressOnResults>" on results
    When I add a car from city center results to cart
    Then the car location label at index 0 should contain "<expectedLabelOnCart>" on cart
    And the car city center address at index 0 should contain "<expectedAddressOnCart>" on cart
    And the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the car location label at index 0 should contain "<expectedLabelOnCart>" on cart
    And the car city center address at index 0 should contain "<expectedAddressOnCart>" on cart
    And the booking status should be "In Progress"

    Examples:
      | pickupLocation | agency      | expectedAgencyStationLabel    | expectedAgencyStationRoad     | expectedAgencyStationAddress                    | expectedLabelOnResults | expectedAddressOnResults                       | expectedLabelOnCart             | expectedAddressOnCart                           | expectedAgencyLocationType |
      | LIS            | SunnyCars   | Lisbon (City Center)          | Rua Dr. Silva Teles nº 5      | Rua Dr. Silva Teles nº 5, Lisboa, 1050-079, PT  | Lisbon (City Center)   | Rua Dr. Silva Teles nº 5, Lisboa, 1050-079, PT | Lisbon (City Center)            | Rua Dr. Silva Teles nº 5, Lisboa, 1050-079, PT  | City Office                |
