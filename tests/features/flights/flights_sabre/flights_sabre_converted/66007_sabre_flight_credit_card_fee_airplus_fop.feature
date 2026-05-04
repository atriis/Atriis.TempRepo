# Test Name: 66007 Sabre - Flight - Credit card fee is displayed when booking with Airplus as FOP
# Status: Active
# Labels: Regression,Sabre,Flights,GDS,Full Purchase,FOP,credit card,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-08-25T05:38:22Z
# Updated: 2026-01-19T07:49:43Z

@regression @flights @sabre @full-purchase @fop @credit-card @cancel-by-process @provider:sabre @priority:high
Feature: 66007 Sabre - Credit card fee displayed when booking with Airplus as FOP
  As a corporate traveler
  I want to see the credit card fee when booking with Airplus
  So that I am aware of the additional charge

  Scenario: Credit card fee is displayed in price breakdown after booking with Airplus FOP
    Given I am logged in as "blancaneves" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "AMS-KRS" and "HEL-AMS"
    And flight results should be available
    And I filter results by carrier "KLM"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    When I click to open price breakdown in cart
    Then "CC Charge" should be visible in price breakdown
    And "CC Charge" amount should match a currency format
