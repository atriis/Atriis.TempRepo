# Test Name: 72547: Sabre NDC (OBT)- Editing APIS info after booking is blocked
# Status: Active
# Labels: Sabre NDC,Regression,Frosch,Flights,APIS,2026 plan 2
# Owner: Noam Miller
# Created: 2026-01-14T05:48:43Z
# Updated: 2026-01-14T11:58:38Z

@regression @flights @sabre @sabre-ndc @apis @provider:sabre_ndc @priority:high
Feature: 72547 Sabre NDC - Editing APIS info after booking is blocked
  As a corporate traveler
  I want APIS info editing to be blocked after booking a Sabre NDC flight
  So that passenger information cannot be modified post-booking

  Scenario: APIS info cannot be edited after Sabre NDC flight is booked
    Given I am logged in as "corp@sabreNdc.frosch" booking a new trip
    And I have added a random guest traveler with phone type "Mobile"
    When I search for a round trip flight from "YYZ" to "LAX"
    And flight results should be available
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I open passenger info and acknowledge the warning "These details cannot be edited after order is created"
    And I accept Terms & Conditions
    And I hold the trip
    Then passenger info editing should be blocked after booking by message "These details cannot be edited after order is created"
    Then I successfully cancel the trip
