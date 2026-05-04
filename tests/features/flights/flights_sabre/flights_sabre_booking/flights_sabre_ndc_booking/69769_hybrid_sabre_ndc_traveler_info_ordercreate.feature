# Test Name: Hybrid for 69769: Sabre NDC - Correctly sending traveler info in OrderCreate RQ
# Status: Active
# Labels: Sabre NDC,Frosch,Flights,Regression,hold flight,Search Flight,APIS,2026 plan 2
# Owner: Noam Miller
# Created: 2025-11-04T10:19:02Z
# Updated: 2026-02-16T12:48:49Z

@regression @flights @sabre-ndc @hold-flight @hybrid
Feature: 69769 Sabre NDC - Correctly sending traveler info in OrderCreate RQ
  As a corporate traveler
  I want to hold a Sabre NDC flight with multiple travelers
  So that the traveler information is correctly sent in the order creation

  Scenario: Sabre NDC flight hold with multiple travelers sends correct info
    Given I am logged in as "corpsabrendc_frosch" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Lauren"
    When I search for a round trip flight from "LAX" to "NYC"
    Then flight results should be available
    And the "NDC Direct Rate" indicator should be visible in results
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    Then I successfully cancel the trip
