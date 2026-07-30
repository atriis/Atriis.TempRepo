# ADO #75769 - [Cars][Sabre] City Center Search - Use Exact Location Address
# Reference test case: ADO #75769
@transportation @cars @daily_cars @provider:sabre @regression  @ado:75769 @priority:critical
Feature: 75769 Sabre city center exact location address display
  As a corporate traveler using Sabre city center search
  I want location formatting to remain consistent from results to cart and booking
  So that I can confirm the exact pickup location before completing the trip

  Scenario Outline: Sabre city center location and label are consistent across booking flow
    Given I am logged in as "automation@sabre.tlc" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "<pickupLocation>" with rental agency "<agency>"
    And the agency station label should contain "<expectedAgencyStationLabel>" and address should contain "<expectedAddressOnResults>" on the vendor list
    And I select the city center pickup location by agency station label "<expectedAgencyStationLabel>" and address "<expectedAddressOnResults>"
    And the car location label at index 0 should contain "<expectedAgencyStationLabel>" on results
    And the car city center address at index 0 should contain "<expectedAddressOnResults>" on results
    When I add a car from city center results to cart
    Then the car location label at index 0 should contain "<expectedLabelOnCart>" on cart
    And the car city center address at index 0 should contain "<expectedAddressOnCart>" on cart
    And the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the car location label at index 0 should contain "<expectedLabelOnCart>" on cart
    And the car city center address at index 0 should contain "<expectedAddressOnCart>" on cart
    And the booking status should be "Confirmed"
    And I successfully cancel the trip

    Examples:
      | pickupLocation               | agency   | expectedAgencyStationLabel             | expectedAddressOnResults                                                                    | expectedLabelOnCart                   | expectedAddressOnCart                                                                       |
      | MAD                          | Europcar | Madrid Plaza Espana (City Center)      | San Leonardo 8, Madrid, 28015, ES                                                           | Madrid Plaza Espana (City Center)     | San Leonardo 8, Madrid, 28015, ES                                                           |
      | Plaza del Emperador Carlos V | Hertz    | Ave Atocha Rr Stn (Railway Station)    | Av Ciudad De Barcelona 3 V P3 Planta 0, Retiro Parking 3 Planta 0 Madrid, Madrid, 28007, ES | Ave Atocha Rr Stn (Railway Station)   | Av Ciudad De Barcelona 3 V P3 Planta 0, Retiro Parking 3 Planta 0 Madrid, Madrid, 28007, ES |