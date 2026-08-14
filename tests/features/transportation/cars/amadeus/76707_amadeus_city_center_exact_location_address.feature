# ADO #76707 - [Cars][Amadeus] City Center Search - Use Exact Location Address
# Reference test case: ADO #76707
@daily_cars @provider:amadeus @regression @transportation @cars @ado:76707 @priority:critical
Feature: 76707 Amadeus city center exact location address display
  As a corporate traveler using Amadeus city center search
  I want location formatting to remain consistent from results to cart and booking
  So that I can confirm the exact pickup location before completing the trip

  Scenario Outline: Amadeus city center location and address second line are consistent across booking flow
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "<pickupLocation>" with rental agency "<agency>"
    And the agency station label should contain "<expectedAgencyStationLabel>" and address should contain "<expectedAgencyStationAddress>" on the vendor list
    And I select the city center pickup location by agency station label "<expectedAgencyStationLabel>" and address "<expectedAgencyStationAddress>"
    # Payload validation (after Car Location List)
    When I capture the "response" payload for request type "Amadeus4.Car_LocationList" from Storage
    And the captured "response" payload for request type "Amadeus4.Car_LocationList" should contain "<expectedAgencyLocationCode>".block("locationAddress")
    Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain "<expectedAgencyLocationCode>".onKey("locationCode")
    And the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain "<expectedAgencyStationLabel>".map("<expectedAgencyLocationCode>")
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
    When I capture the "response" payload for request type "Amadeus4.Car_Availability" from Storage
    And the captured "response" payload for request type "Amadeus4.Car_Availability" should contain "<expectedAgencyLocationCode>".block("address")
    Then the captured "block" payload for request type "Amadeus4.Car_Availability" should contain "<expectedAgencyLocationCode>".onKey("name")
    And the captured "block" payload for request type "Amadeus4.Car_Availability" should contain "<expectedAgencyStationLabel>".map("<expectedAgencyLocationCode>")
    And the booking status should be "Confirmed"
    And I successfully cancel the trip

    Examples:
      | pickupLocation | agency       | expectedAgencyStationLabel  | expectedAgencyStationAddress                                   | expectedLabelOnResults         | expectedAddressOnResults                               | expectedLabelOnCart             | expectedAddressOnCart                                  | expectedAgencyLocationCode |
      | MAD            | Enterprise   | Madrid (Railway Station)    | Estacion Ave Atocha Glorieta Carlos V S N, Madrid, 28045, ES   | Madrid (Railway Station)       | Estacion Puerta De Atocha Ave Av. Carl, Madrid, MA, ES | Madrid (Railway Station)        | Estacion Puerta De Atocha Ave Av. Carl, Madrid, MA, ES | MADX60                     |
      | MAD            | Hertz        | Madrid (City Center)        | Calle Princesa, Madrid, 28008, ES                              | Madrid 28008 (City Center)     | Calle Princesa 14, Madrid 28008, ES                    | Madrid 28008 (City Center)      | Calle Princesa 14, Madrid 28008, ES                    | MADC60                     |
