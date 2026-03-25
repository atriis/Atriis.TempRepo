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
    # TODO: Add meal to one-way flight
    # Testim: Add_meal_to_one_way_flight() — opens meal section, selects a meal option
    # Need new step: When I add a meal to the flight
    # DSL: Cart.addMealToFlight(page) → CartPage selectors for meal panel
    # TODO: Validate meal status is displayed before booking
    # Testim: validate_meal_status_before_booking() — checks meal indicator/icon is visible
    # Need new step: Then the meal status should be visible in cart
    And I add a credit card as payment method
    And I proceed to checkout
    And I complete the booking
    # TODO: Validate meal status is displayed after booking
    # Testim: validate_meal_status_after_booking() — checks meal indicator persists after booking
    # Need same step: Then the meal status should be visible in cart
