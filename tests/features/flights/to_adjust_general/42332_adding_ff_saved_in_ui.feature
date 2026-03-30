# Test Name: 42332 When adding FF, it is successfully saved in the UI
# Status: Active
# Labels: Regression,FQTV,Frequent flyer,Flights,guest,Sabre,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-09T11:44:11Z
# Updated: 2025-11-14T03:17:54Z

@regression @flights @fqtv @sabre
Feature: 42332 Flights - Adding FF is successfully saved in the UI
  As a corporate traveler
  I want to add a frequent flyer number in the cart
  So that my loyalty points are applied to the booking

  Scenario: Adding frequent flyer number is saved successfully
    Given I am logged in as "christree" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a one way flight from "AMS" to "PAR"
    And I click proceed on the reference fields popup
    And I filter results by carrier "KL"
    And I add the first flight to cart
    # TODO: Step needed for "Add frequent flyer number in cart"
    Then I should see a success notification
    # TODO: Step needed for "Verify FF number was saved and displayed in cart"
    Then I successfully cancel the trip
