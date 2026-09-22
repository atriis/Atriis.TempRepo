# Test Name: 35770 Manual quote - Possible to add manual quotes from already existing trip
# Status: Active
# Labels: Manual Quote,No Amadeus Hotel Book,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-09-12T01:55:25Z
# Updated: 2025-10-21T11:33:47Z
@regression @manual_quote
Feature: 35770 Manual Quote - Add manual quote to an already existing trip
  As a corporate traveler
  I want to add a flight manual quote to a trip that already contains a hotel
  So that I can mix real bookings with manual quotes in the same trip

  @priority:critical
  Scenario: Add a flight manual quote after a hotel has been added to the cart
    Given I am logged in as "camilacoelho@manualquotetravelpolicy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LHR" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I navigate to the manual quote search page from the cart
    And I add a flight manual quote from "LON" to "MAD"
    Then I should see a quote with status "On hold"
    And I should see a quote with status "Pending booking"
    And I successfully cancel the trip
