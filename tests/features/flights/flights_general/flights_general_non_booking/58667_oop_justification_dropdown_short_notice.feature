# Test Name: 58667 Flights - When adding to cart a flight that is less than two weeks ahead, saving justification dropdown works as expected
# Status: Active
# Labels: Regression,Flights,Travel policy,OOP,dropdown,general,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-26T07:00:07Z
# Updated: 2025-09-16T02:24:51Z

@regression @flights @general @oop @travel-policy
Feature: 58667 Flights - OOP justification dropdown for flights less than two weeks ahead
  As a corporate traveler
  I want to save OOP justification when booking a flight less than two weeks ahead
  So that I can explain why I'm booking on short notice

  Scenario: Saving justification dropdown works for short-notice flight
    Given I am logged in as "lexasofia@travelpolicytest.com" booking a new trip
    And I have added myself as the traveler
    When I search for a same day one way flight from "LON" to "MAD"
    And I add the first flight to cart
    Then the OOP justification dropdown should be displayed and saving should work as expected
