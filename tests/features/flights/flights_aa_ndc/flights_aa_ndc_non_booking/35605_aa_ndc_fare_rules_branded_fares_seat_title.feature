# Test Name: 35605 NDC AA - Fare rules and branded fares are displayed in results, cart and trip overview and seat title is correct in results page
# Description: Covers results, pricing options and cart. The test case's "Complete booking" and
# trip-overview steps are left out: ami@rickan.com tickets on booking and the trip can no longer be
# cancelled from OBT, so every run would leave a live AA ticket (verified on atriis-stg.app,
# trip 3922815, 2026-10-07). Check the trip overview manually.
# Status: Active
# Labels: AA NDC Regression,Flights,Fare rules,Branded fares,Seating

@flights @aa @ndc @fare_rules @branded_fares
Feature: 35605 AA NDC - Fare rules, branded fares and results seat drawer title

  As a corporate traveler
  I want to see fare rules and branded fare information for an AA NDC flight
  So that I know the fare conditions in results, pricing options and the cart

  Scenario: Fare rules and branded fares are shown in results, pricing options and cart
    Given I am logged in as "ami@rickan.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "JFK" to "ORD"
    And flight results should be available
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I open seat map from results and verify it loads
    Then the seat map drawer title should be "Seats availability"
    When I close the seat map drawer in results
    And I click to open flight details
    And I open branded fares from flight details
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer
    And I close flight details window
    And I click to open first pricing options
    And I open branded fares from pricing options
    Then the branded fare ancillaries text should be visible
    When I close branded fares drawer
    And I click to open fare rules from modal
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I close pricing options modal
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to open fare rules in cart
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    And I open flight details in cart
    And I open branded fares from cart flight details
    Then the branded fare ancillaries text should be visible
    And I close branded fares drawer in cart
