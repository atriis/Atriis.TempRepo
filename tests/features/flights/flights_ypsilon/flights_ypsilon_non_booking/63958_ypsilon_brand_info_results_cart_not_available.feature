# Test Name: 63958 Brand info displayed in results and cart pages, brands not available message
# Description:
# Status: Active
# Labels: Ypsilon,Amsalem,Branded fares,Low cost,Pricing Options,Daily Flights,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-09-10T08:31:34Z
# Updated: 2025-12-30T05:09:11Z

@regression @flights @ypsilon @branded-fares @pricing-options
Feature: 63958 Ypsilon - Brand info displayed in results and cart, brands not available message
  As a corporate traveler using Ypsilon
  I want to see brand information in results and cart pages
  So that I know when brand details are or are not available for my flights

  Scenario: Brand information unavailable message displayed in results and cart
    Given I am logged in as "ypsilon@50687.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "AMS"
    Then flight results should be available
    When I click to open flight details
    And I open branded fares from cart flight details
    Then the brand information unavailable message should be displayed
    And I close branded fares drawer in cart
    And I close flight details window
    When I click to open first pricing options
    And I open branded fares from pricing options
    Then the brand information unavailable message should be displayed
    And I close branded fares drawer
    And I close pricing options modal
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I open flight details in cart
    And I open branded fares from cart flight details
    Then the brand information unavailable message should be displayed
    And I close branded fares drawer in cart
