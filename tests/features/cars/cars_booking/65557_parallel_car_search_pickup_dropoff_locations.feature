@daily_cars @userstory @priority:high @ado:65557
Feature: 65557 Parallel car search - Pick up and drop off locations should be correctly referenced
  As a corporate traveler
  I want to search for a car with different pick up and drop off locations
  So that the results correctly display both distinct locations

  @priority:high @tc:77085
  Scenario: TC-04 Same airport round trip keeps round-trip car search
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "JFK" to "LHR" with parallel car search
    And I add the first result to trip
    And I add the first car to cart
    Then the car location at airport index 0 should contain "heathrow" on cart

  @priority:high @tc:77091
  Scenario: TC-11 NYC-MIA outbound FLL-NYC return - Car picks correct Florida airports
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "NYC-MIA" and "FLL-NYC" with parallel car search
    And I add the first result to trip
    And I add the first car to cart
    Then the car location at airport index 0 should contain "miami" on cart
    And the car location at airport index 1 should contain "fort lauderdale" on cart
