# ADO User Story ID: 77711
# ADO Test Case ID: 79343
@ado:79343 @regression @flights @ndc @copy-trip @priority:critical
Feature: 79343 NDC flight booking - Copy Trip is disabled for NDC bookings
  As a corporate traveler with an NDC flight booking on hold
  I want to see that Copy Trip is disabled for NDC bookings
  So that NDC flight bookings are correctly excluded from trip copy

  Scenario: NDC flight on hold cannot be copied
    Given I am logged in as "noCopyCorp@ndc.ams" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "IAD" to "LON"
    And I select the first flight result in new flight flow
    And I select the second fare from pricing options
    And I add to trip from pricing options
    And I accept Terms & Conditions
    When I hold the trip
    And I copy the trip
    Then the trip should not be eligible for copy trip
