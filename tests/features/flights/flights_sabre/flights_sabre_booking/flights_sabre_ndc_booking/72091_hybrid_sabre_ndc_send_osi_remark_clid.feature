# Test Name: Hybrid for 72091: Sabre NDC - Send OSI remark for CLID
# Status: Active
# Labels: Sabre NDC,Frosch,Agreement,Flights,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-12-31T01:32:42Z
# Updated: 2026-01-21T01:44:14Z

@regression @flights @sabre-ndc @agreement @hybrid
Feature: 72091 Sabre NDC - Send OSI remark for CLID
  As a corporate traveler
  I want to hold a Sabre NDC flight
  So that the OSI remark for CLID is correctly sent in the booking

  Scenario: Sabre NDC flight hold sends OSI remark for CLID
    Given I am logged in as "corpSabreNdc@reg.ams" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "LHR" to "MAD"
    And flight results should be available
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I accept Terms & Conditions
    And I hold the trip
    Then I successfully cancel the trip
