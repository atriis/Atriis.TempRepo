@transportation @cars @regression @provider:sabre
Feature: 55167 Sabre car - can edit loyalty number after checkout

  Scenario: User can edit and add loyalty number after completing car booking
    Given I am logged in as "automation@sabre.tlc" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR"
    And I add the first car to cart
    And the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    When I click the extras arrow button
    And I click to edit the driver/loyalty id extras section
    And I click use existing toggle in the driver/loyalty id extras section
    And I edit the car loyalty number to "565656"
    And I click the save button
    And I wait for 20 seconds
    When I capture the "request" payload for request type "ModifyCarResarvation" from Storage
    Then the captured "request" payload for request type "ModifyCarResarvation" should contain "565656"
    And I successfully cancel the trip with 60 seconds wait