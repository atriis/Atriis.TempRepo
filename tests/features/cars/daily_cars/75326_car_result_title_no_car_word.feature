@daily_cars @provider:amadeus @regression
Feature: Car Search Results - Quote Title Should Not Contain Unexpected "Car" Word
  As a corporate traveler
  When I search for cars via Amadeus
  The result title should show only the car category and type (e.g. "Compact 2/3 Doors")
  Without the standalone word "car" appearing out of context in any result title
  # Related to ADO Bug #75326 - fix: added a space in carType (OBT Frontend)
  # Regression of ADO Bug #74767

  @priority:high
  Scenario: Car result titles do not contain the word "car" as standalone text
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LON"
    And I select the first city center pickup location
    Then none of the car result titles should contain the word "car"
