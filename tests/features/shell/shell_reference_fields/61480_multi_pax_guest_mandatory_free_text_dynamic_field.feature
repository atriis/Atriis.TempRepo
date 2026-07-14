# Test Name: 61480 Multi pax - Guest - Mandatory free text dynamic profile field is displayed for all guest users when TMC has role "Inherit dynamic profile fields questions from booker (guest only)"
# Description:
# Status: Active
# Labels: Dynamic fields,Regression,tmc role,multi pax,guest,mandatory,free text,Daily Shell,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-24T03:58:05Z
# Updated: 2026-02-11T02:43:26Z

@shell @reference_fields @dynamic_fields @regression @guest @multi_pax @checkout
Feature: 61480 - Multi-pax mandatory free-text dynamic profile field is displayed for all guests

  As a booker booking for three guests
  I want the mandatory free-text dynamic profile field shown for all guest users at checkout
  So that each guest's mandatory profile question is displayed and prefilled

  Scenario: Mandatory free-text dynamic profile field is displayed for all three guest travellers
    Given I am logged in as "wiz@dynamictestim.com" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a one way flight from "LON" to "MIA"
    When I add the first flight to cart
    When I proceed to checkout
    And I wait for booking details in checkout
    And the dynamic profile field "testim test dont touch" is displayed for "3" travellers
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    And I successfully cancel the trip
