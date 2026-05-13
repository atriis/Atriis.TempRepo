# Test Name: HYBRID for 45750 Sabre - Separate tickets - SegmentSelect Number="1" is not being sent twice
# Status: Active
# Labels: Regression,Sabre,Flights,separate tickets,hybrid,by schedule,2026 plan 2
# Owner: Bruna Santos
# Created: 2024-05-08T10:24:56Z
# Updated: 2025-12-16T09:02:17Z

@regression @flights @sabre @separate-tickets @by-schedule @hybrid
Feature: 45750 Sabre - Separate tickets by schedule booking
  As a corporate traveler
  I want to book separate ticket flights by schedule with different carriers
  So that the booking processes correctly without duplicate segment selection

  Scenario: Separate tickets are created correctly when booking by schedule with different carriers
    Given I am logged in as "brunasantossabre@sabre.com" booking a new trip
    And I have added a random guest traveler
    When I search for a flight by schedule from "AMS" to "FRA"
    And flight results should be available
    And I filter airline results by "Air France" checkbox
    When I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I filter results by carrier "Tap Air Portugal"
    When I select one flight segment by schedule
    And I wait for "Your Selection" text to be visible
    Then the "Separated Tickets" indicator should be visible in the pricing page
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    When I add a credit card as payment method
    When I fill in the OOP justification text "aaa"
    And I accept Terms & Conditions
    And I hold the trip
    Then I successfully cancel the trip
