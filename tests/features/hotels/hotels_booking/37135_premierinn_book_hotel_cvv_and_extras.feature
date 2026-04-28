# Test Name: 37135 MERGED: PREMIER INN E2E flow
# Description: 
# Status: Active
# Labels: CR7,No Amadeus Hotel Book,Hotel,Full Purchase,Extras,merge,Premier Inn Regression,Pre Prod,Daily Hotels,progress page,Giata,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-10-16T05:46:21Z
# Updated: 2025-09-29T04:07:52Z

@regression @provider:premierinn
Feature: 37135 Premier Inn - Book hotel with CVV and Extras
  As a corporate traveler booking a Premier Inn hotel
  I want to complete a booking with CVV verification and add Premier Inn extras
  So that I can include additional services like breakfast with my stay

  @priority:critical
  Scenario: Premier Inn hotel booked with CVV and extras, then cancelled
    Given I am logged in as "perry" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I wait to see view rates text in results page
    When I sort hotel results by "Price"
    And I select the first hotel result
    And I add a refundable room to my cart
    When I add Premier Inn Extras Services in cart
    And I save Premier Inn Extras Services in cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip
