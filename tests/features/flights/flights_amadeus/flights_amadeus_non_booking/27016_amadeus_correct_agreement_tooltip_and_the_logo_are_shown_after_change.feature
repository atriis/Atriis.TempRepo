# Test Name: 27016 Amadeus - Correct agreement tooltip and the logo are shown after change
# Description:
# Status: Active
# Labels: Administration,Regression,Flights,Amadeus,Agreement,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-03-10T05:27:20Z
# Updated: 2025-12-10T11:11:38Z

@regression @flights @amadeus @agreement @administration
Feature: 27016 Amadeus - Correct agreement tooltip and the logo are shown after change

  As a corporate administrator
  I want an agreement tooltip I edit in administration to immediately reflect in flight pricing options
  So that travelers always see the current agreement terms

  Scenario: Agreement tooltip change in administration is reflected in flight pricing options
    Given I am logged in as "change@toolTip.corp"
    When I navigate to the administration page
    And I open the Agreements section in the administration
    And I open the first agreement listed under the "PTC Special Fares" category in the administration
    And I enter a random value into the agreement tooltip in the administration
    And I enter the comment "regression" for the agreement change in the administration
    And I save the agreement in the administration
    Then the "Save succeeded" confirmation toast should be displayed in the administration
    When I book a new trip
    And I have added myself as the traveler
    And I search for a one way flight from "AMS" to "HKG"
    And I wait for add to trip text to be visible
    And I filter results by "Marine fare" checkbox
    Then the "Marine Fare" indicator should be visible in results
    When I click to open first pricing options
    And I hover over the first fare that has agreement icon in flight pricing options
    Then the agreement tooltip in the first fare that has agreement in pricing options should contain the generated value
    When I switch to the administration page
    And I open the Agreements section in the administration
    And I open the first agreement listed under the "PTC Special Fares" category in the administration
    And I enter the agreement tooltip value "marine fare" in the administration
    And I enter the comment "regression" for the agreement change in the administration
    And I save the agreement in the administration
    Then the "Save succeeded" confirmation toast should be displayed in the administration
    And the agreement tooltip should display "marine fare" in the administration
