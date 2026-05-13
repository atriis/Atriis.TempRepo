# Test Name: Hybrid for 69676: BA NDC - Update FQTV for Pax with middle name
# Description:
# Status: Active
# Labels: BA NDC Regression,Amsalem,FQTV,hold flight,Search Flight,2026 plan 2
# Owner: Noam Miller
# Created: 2025-11-02T08:44:17Z
# Updated: 2025-11-02T11:25:21Z

@regression @flights @ndc @ba @fqtv
Feature: Hybrid for 69676 BA NDC - Update FQTV for traveler with middle name

  As a corporate traveler with a middle name
  I want to add a frequent flyer loyalty number to a BA NDC held booking
  So that I can verify FQTV is updated correctly for a pax with a middle name

  Scenario: FQTV loyalty number is added successfully for traveler with middle name
    Given I am logged in as "baFqtv@update.ams" booking a new trip
    And I have added traveler by name "Elisabeth"
    When I search for a round trip flight from "LHR" to "LAX"
    Then flight results should be available
    When I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    When I click frequent flyer in extras
    And I add loyalty number "1771177117" using airline "Alaska"
    And I should see a success notification
    Then I successfully cancel the trip
