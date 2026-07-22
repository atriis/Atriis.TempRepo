#ADO Test Case: #74234 - Sabre Car Booking Flow with Exact Airport Location

@transportation @cars @provider:sabre @booking @priority:critical @ado:74234
Feature: 74234 Sabre Car Booking Flow with Exact Airport Location
  As a corporate traveler using Sabre
  I want to book cars with exact airport location validation

  @priority:critical
  Scenario: Search for car at LHR with Hertz and verify the exact airport location when CounterLocation in [F,S,O,A,C,M] “Airport - Shuttle required”
    Given I am logged in as "robsoncruz@sabrecargdg.com" booking a new trip
    And I have added a random guest traveler
    When I search for a car at "LHR" with rental agency "Hertz"
    Then the car location label at index 0 should contain "London Heathrow, England (Airport - Shuttle required)" on results
    Then the car location at airport index 0 should contain "Northern perimeter road west, London heathrow, TW6 2QD, GB" on results
    When I add the first car to cart
    Then the car location label at index 0 should contain "London Heathrow, England (Airport - Shuttle required)" on cart
    Then the car location at airport index 0 should contain "Northern perimeter road west, London heathrow, TW6 2QD, GB" on cart
    When I proceed to checkout
    And I complete the booking
    Then the car location label at index 0 should contain "London Heathrow, England (Airport - Shuttle required)" on cart
    Then the car location at airport index 0 should contain "Northern perimeter road west, London heathrow, TW6 2QD, GB" on cart
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip


  @priority:critical
  Scenario: Search for car at LHR with Europcar and verify the exact airport location when CounterLocation = "I"
    Given I am logged in as "robsoncruz@sabrecargdg.com" booking a new trip
    And I have added a random guest traveler
    When I search for a car at "LHR" with rental agency "Europcar"
    Then the car location label at index 0 should contain "London Heathrow, England (Airport - In Terminal)" on results
    Then the car location at airport index 0 should contain "Northern Perimeter Road West, Hounslow, London Heathrow Airport, TW6 2QE, GB" on results
    When I add the first car to cart
    Then the car location label at index 0 should contain "London Heathrow, England (Airport - In Terminal)" on cart
    Then the car location at airport index 0 should contain "Northern Perimeter Road West, Hounslow, London Heathrow Airport, TW6 2QE, GB" on cart
    When I proceed to checkout
    And I complete the booking
    Then the car location label at index 0 should contain "London Heathrow, England (Airport - In Terminal)" on cart
    Then the car location at airport index 0 should contain "Northern Perimeter Road West, Hounslow, London Heathrow Airport, TW6 2QE, GB" on cart
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip   