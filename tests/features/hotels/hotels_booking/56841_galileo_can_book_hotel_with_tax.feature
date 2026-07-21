# Test Name: 56841 Galileo - Hotel - Booking specific hotel
# Description: 
# Status: Active
# Labels: Galileo,Hotel,Regression,specific,Full Purchase,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-07-24T12:36:06Z
# Updated: 2025-11-14T05:24:19Z

@regression @provider:galileo
Feature: 56841 Galileo - Hotel - can book hotel with tax
  As a corporate traveler using Galileo
  I want to fill in a financial reference field during checkout
  So that the booking is correctly coded for expense reporting

  @priority:high
  Scenario: Can book hotel with tax
    Given I am logged in as "galileogaliei@gdggalileo.com" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "The Ritz-Carlton, Dubai International Financial Centre" for 1 night
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    And I click on price details button in room level results
    Then I see "£" in taxes and fees row
    And I close price details dialog
    And I add a refundable room to my cart
    When I proceed to checkout
    And I wait for booking details in checkout
    And I fill in the "ORDER NUMBER" reference field with "1111"
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip with 60 seconds wait
