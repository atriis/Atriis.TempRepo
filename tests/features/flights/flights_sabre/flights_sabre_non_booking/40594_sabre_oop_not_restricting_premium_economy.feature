# Test Name: 40594 Sabre - OOP is not restricting Premium Economy as per admin configuration
# Status: Active
# Labels: Sabre,OOP,Regression,Travel policy,restriction,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-02-12T11:29:32Z
# Updated: 2025-09-14T08:54:44Z

@regression @flights @sabre @oop @travel-policy
Feature: 40594 Sabre - OOP is not restricting Premium Economy as per admin configuration
  As a corporate traveler
  I want Premium Economy flights to not be restricted by OOP
  So that I can add them to my trip without policy blocking

  Scenario: Premium Economy flight is not restricted by OOP and can be added to cart
    Given I am logged in as "carinabarbara" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "QQS" to "XPG"
    And flight results should be available
    Then the out of policy indicator should not be visible in results
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the out of policy indicator should not be visible in cart
