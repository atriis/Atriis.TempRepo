# Test Name: 30585 Can checkout if there is an approved product with justification
# Description:
# Status: Active
# Labels: Hotel,Cars,Approval flow,Regression,No Amadeus Hotel Book,progress page,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-05-16T10:24:58Z
# Updated: 2025-09-11T01:32:12Z

@regression @shell @hotels @flights @approval @oop
Feature: 30585 - Checkout possible when an approved product with justification exists
  As a corporate traveler with an out-of-policy product that needs justification
  I want to book the justified product and then add a second product
  So that I can confirm checkout still works when an approved product with justification is already in the trip

  Scenario: Book an OOP hotel with justification, add a flight, and cancel the trip
    Given I am logged in as "brunasantos@approval.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LHR" for 1 night
    And I click proceed after search
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    And I add a refundable room to my cart
    And I fill credit card cvv if needed
    And I fill in the OOP justification text "abc"
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    And I complete the booking
    # TODO: wait for the "/Night/" text to be displayed in the hotel trip overview after booking
    #       proposed step: Then the hotel night count should be displayed in the trip overview
    And I click to add a flight to my trip from cart
    When I edit the flight search from "ATH" to "LHR"
    And flight results should be available
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    # TODO: navigate back to the cart from the checkout page (wait for "Book and Finalize", then click the cart icon)
    #       proposed step: When I navigate back to the cart from checkout
    Then I successfully cancel the trip
