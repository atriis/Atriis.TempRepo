@transportation @cars @regression
Feature: 59775 - Cars Different Pickup and Drop-off Location Edit

  Scenario: Verify different drop-off and pick-up location is updated correctly after edit search
    Given I am logged in
    When I search for cars with different pickup and drop-off locations
    And I add the car to cart
    And I edit the search to change the locations
    Then the new pickup location should be updated correctly
    And the new drop-off location should be updated correctly
