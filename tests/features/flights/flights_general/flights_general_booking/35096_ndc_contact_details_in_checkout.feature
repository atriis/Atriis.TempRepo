# Test Name: 35096 NDC Flights - "Contact details" are displayed in checkout page
# Status: Active
# Labels: Flights,Lufthansa NDC Regression,general,contact info,Checkout,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-04-07T07:00:22Z
# Updated: 2025-09-29T04:16:01Z

@regression @flights @ndc @lufthansa @checkout
Feature: 35096 NDC Flights - Contact details are displayed in checkout page
  As a corporate traveler booking an NDC flight
  I want to see contact details on the checkout page
  So that I can verify my contact information before booking

  Scenario: Contact details are displayed in checkout page for NDC flight
    Given I am logged in as "claraaguiar@ndclhclara.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "FRA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I proceed to checkout
    Then "Contact details" should be displayed in the checkout page
    When I navigate to cart from checkout
    Then I successfully cancel the trip