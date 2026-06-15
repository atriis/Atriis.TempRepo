# ADO Test Case ID: 77711
@ado:77711 @regression @flights @ndc @copy-trip @priority:critical
Feature: 77711 NDC - Trip is not eligible for copy trip

  As a corporate traveler using an NDC supplier
  I want to verify that NDC bookings cannot be copied
  So that copy trip restrictions are enforced for NDC flights

  Scenario: NDC flight on hold is not eligible for copy trip
    Given I am logged in as "noCopyCorp@ndc.ams" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "IAD" to "LON"
    And I select the first flight result in new flight flow
    And I select the second fare from pricing options
    And I add to trip from pricing options
    And I accept Terms & Conditions
    When I hold the trip
    Then the trip should not be eligible for copy trip
