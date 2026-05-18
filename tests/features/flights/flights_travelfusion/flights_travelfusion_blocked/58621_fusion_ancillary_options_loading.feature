# Test Name: 58621 Fusion - Ancilary options are loading as expected
# Status: Active
# Labels: Fusion,Regression,Flights,ancillary,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-25T08:14:54Z
# Updated: 2025-02-25T08:32:13Z

@regression @flights @fusion @ancillary @priority:medium
Feature: 58621 Fusion - Ancillary options load as expected
  As a corporate traveler booking a Fusion flight
  I want the ancillary options section to load and allow selection
  So that I can add ancillary services to my booking

  Scenario: Ancillary options load and a selection is saved in cart
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "KNO" to "KUL"
    And I filter results by carrier "QZ"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit the ancillary options section
    And I select the first ancillary option
    And I click the save button
    Then the booking status should be "Pending booking"
    Then the ancillary options filled indicator should be visible
