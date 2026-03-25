# Test Name: 58325 Amadeus - Flight booking succeeds when traveller's name has space or period (.)
# Description:
# Status: Active
# Labels: Amadeus,Flights,Regression,hold flight,Full Purchase,traveler name,GDS,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-09T11:51:42Z
# Updated: 2025-12-11T07:18:31Z

@regression @flights @amadeus @traveler-name @hold
Feature: 58325 Amadeus - Booking succeeds with traveler name containing space or period
  As a corporate traveler
  I want to book a flight when my name contains spaces or periods
  So that special characters in names don't prevent booking

  Scenario: Book and hold flight with traveler name containing space
    # TODO: This test uses a custom guest traveler with space-containing names
    # Testim: Add_random_traveler_with_space() — adds guest with names like "Tyler  " and "Carol  Smith"
    # Need new step: Given I have added a random guest traveler with space in name
    # Or modify existing addRandomGuest to handle name variants
    Given I am logged in as "bruna_nlgov" booking a new trip
    And I have added a random guest traveler
    When I search for a random one way flight
    And I add the first flight to cart
    # TODO: Select FOP (conditional payment method selection)
    # Testim: Selecting_fop() — clicks add-form-payment, selects card, saves
    And I click add payment method button
    And I select card 1 and save
    # TODO: Fill free text justification if OOP (conditional)
    # Testim: Fill_free_text_justification_in_cart_if_needed()
    And I accept Terms & Conditions
    And I hold the trip
    Then I successfully cancel the trip
