@regression @provider:lufthansa
Feature: Lufthansa NDC - One Way Flight Booking
  As a corporate traveler using Lufthansa NDC
  I want to search and book one-way flights
  So that I can complete my flight booking end-to-end

  @priority:critical
  Scenario: Complete one-way flight booking end-to-end
    Given I am logged in as "clara" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "mucToFra"
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
    And I accept Terms & Conditions
    When I hold the trip
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
    Then I successfully cancel the trip

