# Test Name: 66139 AFKL NDC - Flight - Complete trip booking and verifying fare rules
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,Fare Rules,Hold,Full Purchase
# Owner: Bruna Santos

@regression @flights @afkl @ndc @fare-rules @hold
Feature: 66139 AFKL NDC - Complete trip booking with fare rules verification
  As a corporate traveler
  I want to verify fare rules across results, pricing options, flight details, cart and price breakdown
  So that the strictest terms note is consistently displayed before and after holding the trip

  Scenario: Verify fare rules in every entry point and hold the AFKL NDC trip
    Given I am logged in as "brunafranclub@tmcclubcorp.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "PAR" to "AMS"
    And flight results should be available
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I click to open first pricing options
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    Then I close pricing options modal
    When I click to open flight details
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I click to open flight details
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    When I click to open price breakdown in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close price breakdown modal
    When I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    When I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    When I click to open flight details
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close flight details window
    When I click to open price breakdown in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close price breakdown modal
    Then I successfully cancel the trip
