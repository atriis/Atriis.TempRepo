# Test Name: 59595 Multi pax - Dynamic profile fields are displayed for both guest travellers when TMC has role "Inherit dynamic profile fields questions from booker (guest only)"
# Description:
# Status: Active
# Labels: Dynamic fields,Regression,tmc role,multi pax,guest,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-14T10:38:47Z
# Updated: 2025-08-04T09:19:53Z

@shell @reference_fields @dynamic_fields @regression @guest @multi_pax @checkout
Feature: 59595 - Multi-pax dynamic profile fields are displayed for both guest travellers

  As a booker booking for two guests
  I want the dynamic profile fields shown for both guest travellers at checkout
  So that each guest's inherited profile questions are displayed

  Scenario: Dynamic profile fields are displayed for both guest travellers at checkout
    Given I am logged in as "caroldynamics@club.com" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a one way flight from "LON" to "MIA"
    When I add the first flight to cart
    When I proceed to checkout
    And I wait for booking details in checkout
    And the dynamic profile field "DYNA PROF TST" is displayed for "2" travellers
    And the dynamic profile field "DYNAMIC PROFILE FIELDS TESTIM" is displayed for "2" travellers
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    And I successfully cancel the trip
