# Test Name: 66654 Ratehawk - 'Check-In Date' Travel Policy - OOP icon is not displayed for in policy hotels
# Description: 
# Status: Active
# Labels: Ratehawk Regression,Hotel,Full Purchase,special request,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-09T02:31:23Z
# Updated: 2025-09-09T03:29:33Z

@regression @provider:ratehawk
Feature: 66654 Ratehawk - OOP policy not displayed for in-policy travelers
  As a corporate traveler booking within policy
  I want to confirm that no OOP indicator is shown at any stage of the booking
  So that I know my booking is compliant with company policy

  @priority:high
  Scenario: OOP indicator is not shown in results, cart, or trip overview for in-policy booking
    Given I am logged in as "ratehawk" "user_one" booking a new trip
    And I have added traveler by name "Carla Carolina"
    When I search for a hotel in "London, UK" for 1 night
    Then the out of policy indicator should not be visible in results
    And I add the first available room to my cart
    Then the out of policy indicator should not be visible in cart
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    # TODO: Create step "Then the out of policy indicator should not be visible in the trip overview" that calls DSL verifyOOPNotInTripOverview in Trip.js
    When I cancel the trip
