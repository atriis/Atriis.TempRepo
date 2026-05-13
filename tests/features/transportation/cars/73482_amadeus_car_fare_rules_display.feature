# Test Name: 73482 Amadeus - Cars - Verify that the terms/fare rules are loading in results, cart and checkout
# Labels: Cars, Full Purchase, Regression, Daily Transportation
# Owner: Pedro Carneiro
# Created: 2026-02-06T03:48:26Z
# Updated: 2026-02-06T04:48:38Z

@regression @cars @amadeus @full-purchase @daily-transportation
Feature: 73482 Amadeus car fare rules display across booking flow

  As an Amadeus car traveler
  I want to see fare rules and terms displayed correctly at each booking stage
  So that I understand the full pricing terms before committing

  Background:
    Given I am logged in as "testim@car.com" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify Amadeus car fare rules display in results, cart, and checkout
    When I search for a car at "LHR"
    # TODO: Verify fare rules are displayed and clickable in results
    When I add the first car to cart
    And I fill free text justification if needed
    # TODO: Verify fare rules are displayed and clickable in cart
    And I accept Terms & Conditions
    And I proceed to checkout
    And I complete the booking
    # TODO: Verify fare rules are displayed and clickable in checkout
    When I cancel the trip
    Then I successfully cancel the trip
