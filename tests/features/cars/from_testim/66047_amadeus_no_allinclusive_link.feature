@transportation @cars @regression @provider:amadeus
Feature: 66047 - Amadeus Car - All Inclusive Rate Link Not Displayed

  Scenario: Verify all inclusive rate link is not displayed for Amadeus supplier
    Given I am logged in with an Amadeus account
    When I search for cars
    Then the all inclusive rate link should not be displayed
