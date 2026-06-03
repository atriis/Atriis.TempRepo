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
    When I search for a hotel in "London" for 1 night
    And I click proceed button if visible
    And I wait to see view rates text in results page
    When I sort hotel results by "Price"
    And I select the first hotel result
    And I add a refundable room to my cart
    And I fill credit card cvv if needed
    And I fill in the OOP justification text "abc"
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    And I send booking for approval
    Then the booking status should be "Confirmed"
    And I click to add a flight to my trip from cart
    When I edit the flight search from "LON" to "DOH" with the same dates as the hotel search
    And flight results should be available
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    And I wait for booking details in checkout
    And I navigate to cart from checkout
    Then I successfully cancel the trip
