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
    Given I am logged in as "sabre_testim" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "JFK" to "DFW"
    And flight results should be available
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I proceed to checkout
    Then "Contact details" should be displayed in the checkout page
    And the contact telephone on checkout should contain numbers
    And the contact email on checkout should contain "sabre@testim.com"
    When I complete the booking
    And I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
