@transportation @cars @regression
Feature: 54894 - Cars Drop-off and Pick-up Location Consistency

  Scenario: Verify drop-off and pick-up locations in cart match the ones from results page
    Given I am logged in
    When I search for cars
    And I select a car from the results page
    And I note the pickup and drop-off locations on the results page
    Then the cart should display the same pickup location
    And the cart should display the same drop-off location
