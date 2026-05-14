@transportation @cars @regression @provider:sunnycars
Feature: SunnyCars - Verify expiry tooltip minutes display

  As a traveler
  I want to see accurate expiry time information for car reservations
  So that I know how long I have to complete my booking

  Scenario: Book SunnyCars car and verify expiry tooltip displays correct minutes
    Given I am logged in as "kaylesun"
    When I book a new trip
    And I add myself as the traveler
    And I search for cars in "Palma de Mallorca, (PMI) Spain"
    And I answer reference fields with "Chris Tree Fake Test" and proceed
    And I add a car from the results to the cart
    And I wait for the pending booking to be ready
    Then the expiry tooltip should display "15" minutes
