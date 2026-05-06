# Test Name: 64944 AFKL - Display rule works as expected when configured
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,Display Rules
# Owner: Bruna Santos

@regression @flights @afkl @ndc @display-rules
Feature: 64944 AFKL - Display rule restricts results outside Europe and allows results within Europe
  As a corporate traveler
  I want display rules to filter flight results by region
  So that only allowed regions return results

  Scenario: Non-Europe destination returns no results, Europe destination returns results
    Given I am logged in as "patricia_afkl_displayrule" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "PAR" to "NYC"
    Then the no results found message should be displayed
    When I edit the flight search from "PAR" to "AMS"
    Then flight results should be available