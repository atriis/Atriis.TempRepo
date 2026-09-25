# Test Name: 29426 MERGED Sabre flight booking + Verify that the terms/fare rules are loading in results, cart and checkout + contact info appears for the booker
# Status: Active
# Labels: Flights,Sabre,Fare Rules,No Amadeus Hotel Book,Regression,contact info,Sanity,Pre Prod,Full Purchase,progress page,Cancel by process,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-20T01:26:42Z
# Updated: 2026-02-04T10:12:19Z

@regression @flights @sabre @fare-rules @full-purchase @cancel-by-process
Feature: 29426 Sabre - Flight booking with fare rules and contact info verification
  As a corporate traveler
  I want to book a Sabre flight and verify fare rules load in results, cart and checkout
  So that I can confirm terms are available and contact info appears for the booker

  Scenario: Sabre flight booking with fare rules in results, cart and checkout plus contact info
    Given I am logged in as "brunasabre@clubcorp.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "JFK" to "DFW"
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    When I click to open flight details
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    And I close flight details window
    When I click to open first pricing options
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    Then I close pricing options modal
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    When I click to open flight details
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    And I close flight details window
    When I click to open price breakdown in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    And I close price breakdown modal
    And I proceed to checkout
    Then the contact email on checkout should contain "@atriis"
    Then the contact telephone on checkout should contain numbers
    And I complete the booking
    Then the quote destination should contain "Flight to"
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    When I click to open flight details
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    And I close flight details window
    When I click to open price breakdown in cart
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    And I close fare rules window
    And I close price breakdown modal
    