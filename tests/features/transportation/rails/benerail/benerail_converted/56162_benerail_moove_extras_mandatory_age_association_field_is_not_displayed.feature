# Test Name: 56162 Benerail Moove - Extras - Mandatory "Age Association" field is not displayed
# Description:
# Status: Active
# Labels: Benerail Moove Regression,Rail,Extras,Cart,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-02T07:13:34Z
# Updated: 2025-05-12T11:54:29Z
@wip @transportation @rails @benerail @regression
Feature: 56162 Benerail - Mandatory Age Association field is not displayed in extras for guest traveler
  As a corporate traveler booking for a guest
  I want the mandatory Age Association field to NOT appear in the Benerail extras for a guest passenger
  So that the extras section remains clean and uncluttered

  Scenario: Age association mandatory field is not shown in Benerail extras for guest traveler
    Given I am logged in as "pmac@bene.ral" booking a new trip
    And I have added a random guest traveler
    When I search for a one way Benerail train from "bebmiToSchiphol"
    When I add a Benerail one way to the trip
    And the booking status should be "Pending booking"
    Then the age association mandatory field should not be displayed in the Benerail extras
