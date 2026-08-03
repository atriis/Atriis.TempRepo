@regression @flights @priority:medium @domain:flights @workitem:74825
Feature: 74825 Flight pricing options fare component visual validation
  As a traveler
  I want the pricing options fare component text to use the correct color
  So that fare details remain readable and consistent

  # Source: ADO #74825 - [Flights new flow][Pricing options][FE] - Incorrect Text Color in Fare Component
  # Note: Step catalog currently has no direct text-color assertion step.

  Scenario: Verify pricing options fare component is rendered and ready for color validation
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "lhrToMad"
    Then flight results should be available
    When I click to open first pricing options
    Then I should see the heading "Pricing Options"
    Then the fare component text color should be "rgb(30, 30, 30)" in pricing options
