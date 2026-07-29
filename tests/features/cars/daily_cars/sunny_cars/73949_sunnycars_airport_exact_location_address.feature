# ADO Test Case: #73949 - Sunnycars airport location format in results and cart

@transportation @cars @regression @daily_cars @provider:sunnycars @priority:high @ado:73949
Feature: 73949 Sunnycars airport location format in results and cart
  As a corporate traveler using Sunnycars
  I want airport car locations to show the supplier location label and address
  So that I can identify the exact pickup and dropoff location context

  Scenario: LHR shows shuttle-required airport location format on results and cart
    Given I am logged in as "automation@sunnycar.gdg" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with 1 months ahead
    Then the car location label at index 0 should contain "London - Heathrow Airport (Airport - Shuttle required)" on results
    And the car location at airport index 0 should contain "London - Heathrow Airport, LHR, GB" on results
    When I add the first car to cart
    Then the car location label at index 0 should contain "London - Heathrow Airport (Airport - Shuttle required)" on cart
    And the car location at airport index 0 should contain "London - Heathrow Airport, LHR, GB" on cart

  Scenario: LGW shows in-terminal airport location format on results and cart
    Given I am logged in as "automation@sunnycar.gdg" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LGW" with 1 months ahead
    Then the car location label at index 0 should contain "London Gatwick Airport (Airport - In Terminal)" on results
    And the car location at airport index 0 should contain "London Gatwick Airport, LGW, GB" on results
    When I add the first car to cart
    Then the car location label at index 0 should contain "London Gatwick Airport (Airport - In Terminal)" on cart
    And the car location at airport index 0 should contain "London Gatwick Airport, LGW, GB" on cart