# Test Name: 37337 Fusion - Book flight with meal
# Status: Active
# Labels: Cart,Regression,meal,Flights,Fusion,Full Purchase,progress page,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-10-25T06:11:50Z
# Updated: 2026-01-26T03:11:43Z

@regression @flights @fusion @meal @full-purchase @priority:high
Feature: 37337 Fusion - Book flight with meal
  As a corporate traveler booking a Fusion flight with a meal
  I want to add a meal to my booking and complete the purchase
  So that my meal preference is recorded with the booking

  Scenario: Book Fusion VietJet flight with meal added
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a one way flight from "HAN" to "BKK"
    Then flight results should be available
    When I filter results by carrier "VietJet"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    # TODO: implement 'I add a meal to the flight' — see Add_meal() in Testim source (test 37337)
    When I fill credit card cvv if needed
    And I proceed to checkout
    # TODO: implement 'I handle the price change prompt if visible' — see Price_change_prompt() in Testim source (test 37337)
    When I proceed to checkout and handle Fusion verification
    # TODO: implement 'the trip overview should display flight details' — see Flights___Trip_Overview___Wait_for__Flight_details__text_display() in Testim source (test 37337)
