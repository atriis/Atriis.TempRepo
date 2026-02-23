@daily_flights @provider:amadeus
Feature: 56103 [Merge] Amadeus - APIS - Passport is masked when user does not have "Can edit and view profile for other users" privilege and go to checkout
  As a corporate traveler using Amadeus supplier
  I want to search a one-way flight to the United States and add it to cart
  So passport information should be masked 
  I can complete my flight booking end-to-end

  @priority:critical
  Scenario: Passport is masked when user does not have "Can edit and view profile for other users" privilege and checkout navigation
    Given I am logged in as "amadeus" "rui_mendes" booking a new trip
    And I have added traveler by name "Rui Marista"
    When I search for a one way flight from "LIS" to "NYC"
    And I add the first flight to cart
    When I click to edit extras at index 0
    Then passport details are displayed as "AF-******345"
    And I proceed to checkout
    And I navigate to cart from checkout
    Then the booking status should be "On Hold"
    Then I successfully cancel the trip