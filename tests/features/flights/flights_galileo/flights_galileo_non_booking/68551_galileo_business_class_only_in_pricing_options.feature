# Test Name: 68551 Galileo - Flight - Only 'Business' class is displayed in Pricing Options when class is selected in search form
# Status: Active
# Labels: Regression,Galileo,Flights,Cabin class,Pricing Options,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-08T03:56:14Z
# Updated: 2025-10-08T04:12:17Z

@regression @galileo @flights @cabin_class @pricing_options
Feature: 68551 Galileo - Only Business class in pricing options when selected

  As a corporate traveler
  I want only Business class options in pricing options when I search for Business
  So that results match my cabin class preference

  Scenario: Business class search shows only Business in pricing options
    Given I am logged in as "bsgalileoflight@galileoflight.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip "Business" class flight from "AMS" to "LCY"
    And flight results should be available
    And I click to open first pricing options
    Then the "Business" text should be displayed in pricing options
    And there should be 1 elements matching css locator ".cabin-class-tabs .el-tabs__item"
