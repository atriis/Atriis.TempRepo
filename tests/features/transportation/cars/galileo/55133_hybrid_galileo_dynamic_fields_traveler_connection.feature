@transportation @cars @regression @provider:galileo
Feature: HYBRID 55133 Galileo - dynamic field send as remark with traveler connection

  Scenario: Dynamic fields are filled and sent as remarks with traveler connection
    Given I am logged in as "rafael@dinmark.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "rafi din"
    When I initiate a car search at "LHR"
    And I click proceed button if visible
    And I add the first car to cart
    And the booking status should be "Pending booking"
    And I click to edit the driver/loyalty id extras section
    And I select "Rafael Dinmark" as the driver
    And I click the save button
    Then I should see a success notification
    And I proceed to checkout
    And I wait for booking details in checkout
    Then the reference field values are:
    | 7878 |
    | htht |
    When I complete the booking
    Then the booking status should be "Confirmed"
