# Test Name: HYBRID for 26814 fusion meals (API Validation)
# Status: Active
# Labels: hybrid,Flights,Fusion,Regression,Full Purchase,meal,2026 plan 2
# Owner: Shani Hadar
# Created: 2024-10-31T06:11:00Z
# Updated: 2026-02-17T09:07:37Z

@regression @flights @fusion @meal @hybrid @full-purchase @priority:high
Feature: 26814 Fusion - Meal selection on Air Arabia flight (hybrid / API validation)
  As a corporate traveler booking an Air Arabia flight via Fusion
  I want to add a meal selection and complete booking
  So that meal preferences are persisted in the booking and sent in the API request

  Scenario: Add a roasted-beef meal on Air Arabia Fusion flight and complete booking
    Given I am logged in as "uzi@yonon.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "NBO" to "SHJ"
    And I click proceed button if visible
    Then flight results should be available
    When I filter results by carrier "Air Arabia"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit the meal extras section
    And I add meal "Roasted Beef Panini - 20.00AED" to the flight
    And I should see a success notification
    And I click to edit the meal extras section
    Then the saved meal should display "Roasted Beef Panini - 20.00AED"
    When I fill credit card cvv if needed
    When I proceed to checkout
    And I complete the booking with Fusion credit card verification
    Then the quote destination should contain "Flight to"
