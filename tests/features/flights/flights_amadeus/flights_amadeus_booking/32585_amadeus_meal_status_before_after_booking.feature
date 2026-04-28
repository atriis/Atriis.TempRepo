# Test Name: 32585 MERGED Display meal status in cart before and after booking
# Description: Display meal status in cart before booking
# Status: Active
# Labels: No Amadeus Hotel Book,meal,Flights,Regression,Full Purchase,Amadeus,Cart,progress page,Cancel by process,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-25T11:35:09Z
# Updated: 2026-01-19T07:33:31Z

@regression @flights @amadeus @meal @full-purchase
Feature: 32585 Amadeus - Meal status displayed in cart before and after booking
  As a corporate traveler
  I want to see meal status in the cart before and after booking
  So that I know my meal preferences are correctly applied

  Scenario: Meal status is visible before and after booking
    Given I am logged in as "testim_meal" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "NYC"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit the meal extras section
    And I add meal "Diabetic Meal (DBML)" to the flight
    And I click to edit the meal extras section
    Then the selected meal should have status "Reservation in progress, proceed to checkout for finalization"
    When I add a credit card as payment method
    Then the payment method should be added
    When I fill credit card cvv if needed
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Finalizing"
    When I click the extras arrow button
    And I click to edit the meal extras section
    Then the selected meal should have status matching "(In progress)|(Declined by)"
    
