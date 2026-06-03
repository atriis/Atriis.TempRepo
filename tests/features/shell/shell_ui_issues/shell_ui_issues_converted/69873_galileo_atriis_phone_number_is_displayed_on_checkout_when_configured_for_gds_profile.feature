# Test Name: 69873 Galileo - Atriis phone number is displayed on checkout when configured for GDS Profile
# Description:
# Status: Active
# Labels: Flights,Full Purchase,Galileo,GDS,Regression,phone number,Profile,Checkout,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-11-06T02:57:36Z
# Updated: 2026-01-19T03:23:25Z

@regression @shell @flights @galileo @gds @checkout
Feature: 69873 Galileo - Atriis phone number is displayed on checkout when configured for GDS Profile
  As a corporate traveler using a Galileo GDS profile with a configured Atriis phone number
  I want to verify that the phone number is displayed on the checkout page
  So that I can confirm the GDS profile phone number configuration is correctly surfaced during booking

  Scenario: Galileo Atriis phone number is visible on checkout when configured for GDS profile
    Given I am logged in as "william.wetlands@atriis.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "GRU"
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the trip status should be "Pending booking"
    When I add a credit card as payment method
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    # TODO: verify the Atriis phone number parts ("888", "666", "76876") are displayed on the checkout page for the GDS profile
    #       proposed step: Then the Atriis phone number "888 666 76876" should be displayed on checkout for the GDS profile
    #       DSL method to add: Checkout.verifyGDSProfilePhoneNumber(page, countryCode, areaCode, number)
    When I navigate to cart from checkout
    Then the trip status should be "On hold"
    And I successfully cancel the trip
