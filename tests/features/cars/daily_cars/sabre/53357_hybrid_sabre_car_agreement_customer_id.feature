@transportation @cars @regression @provider:sabre
Feature: 53357 - Sabre car - Agreement with customer ID number

  Scenario: Car booking with agreement field populated by customer ID number
    Given I am logged in as "tree@tree.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a car search at "MXP" with rental agency "National"
    And I select the trip purpose as "BILLABLE" and proceed
    And I add the first car to cart
    And the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    And I successfully cancel the trip with 60 seconds wait 
