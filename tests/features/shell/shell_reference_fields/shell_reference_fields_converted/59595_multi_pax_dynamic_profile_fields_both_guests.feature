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
    # TODO: implement step - add a second random guest traveller
    And I have added a second random guest traveler
    When I search for a one way flight from "LON" to "MIA"
    When I add the first flight to cart
    When I proceed to checkout
    # TODO: implement step - verify the checkout booking details page is displayed
    Then the checkout booking details are displayed
    # TODO: implement step - verify the dynamic profile fields are displayed for both guest travellers
    And the dynamic profile field "DYNA PROF TST" is displayed for both guest travellers
    And the dynamic profile field "DYNAMIC PROFILE FIELDS TESTIM" is displayed for both guest travellers
    When I open the cart
    Then I successfully cancel the trip
