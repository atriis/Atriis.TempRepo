# Test Name: 46763 Fusion - It is not possible to add an empty FQTV to Fusion flight
# Status: Active
# Labels: Regression,Fusion,Flights,FQTV,FailedFusion,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-04T07:31:37Z
# Updated: 2024-06-04T07:43:35Z

@regression @flights @fusion @fqtv @priority:medium
Feature: 46763 Fusion - Empty FQTV cannot be added to a Fusion flight
  As a corporate traveler adding a frequent flyer number on a Fusion flight
  I want the system to prevent saving an empty FQTV
  So that invalid FQTV data is not submitted with my booking

  Scenario: Saving an empty FQTV on a Fusion flight shows a required field error
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "GLA" to "BRS"
    And I add the first flight to cart
    When I click frequent flyer in extras
    And I attempt to save the FQTV section without entering a value
    Then the FQTV section should display "This field is required" error