# Test Name: 33157 restricted car rental agency should not appear in the results
# Labels: Regression, Cars, restriction
# Owner: Bruna Santos
# Created: 2025-03-13T08:19:03Z
# Updated: 2025-03-13T08:37:35Z

@regression @cars
Feature: 33157 Restricted car rental agency not shown in results
  As a traveler under rental-agency restrictions
  I want restricted agencies to be excluded from car results
  So that only policy-compliant agencies are displayed

  @priority:high
  Scenario: Verify restricted rental agency does not appear in car results
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a car search at "Hato Intl. (CUR), Willemstad, Netherlands Antilles" with rental agency "Thrifty"
    And I select the "Soort reis/Type of trip" reference field as "Medical leave" and proceed
    Then the no results found message should be displayed
