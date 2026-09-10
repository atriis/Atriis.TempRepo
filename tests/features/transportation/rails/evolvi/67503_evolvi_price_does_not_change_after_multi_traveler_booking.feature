# Test Name: 67503 Evolvi - Price does not change after Multi Traveler booking
# Description:
# Status: Active
# Labels: multi pax,Regression,Rail,Evolvi,Full Purchase,price,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-23T01:37:49Z
# Updated: 2025-09-23T02:11:35Z
@transportation @rails @evolvi @regression
Feature: 67503 Evolvi - Price does not change after Multi Traveler booking
  As a travel booker
  I want to book an Evolvi UK Rail fare for three travelers
  So that the price shown in the cart is the same price charged after the booking is completed

  Scenario: The Evolvi multi traveler price is unchanged between cart and trip overview
    Given I am logged in as "elisabete@testim.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a one way Evolvi train from "licTo105"
    And I acknowledge the push notification
    And I add an Evolvi one way to the trip
    And the booking status should be "Pending booking"
    When I extract the price at index 0 from "cart"
    And I fill mandatory Evolvi fields in cart
    And I proceed to checkout
    And I complete the booking
    Then the more details link should be displayed in the trip overview
    When I extract the price at index 0 from "cart"
    Then the extracted price at index 0 should equal the extracted price at index 1 within tolerance of 0.39
