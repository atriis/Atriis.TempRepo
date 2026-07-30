# Test Name: 62861 Sunny Cars - Drop-off location has text instead of '0'
# Labels: Cars, SunnyCars Regression, location, Regression
# Owner: Bruna Santos
# Created: 2025-06-03T07:13:21Z
# Updated: 2025-08-18T10:12:41Z

@transportation @cars @regression @daily_cars @provider:sunnycars @priority:high @ado:62861
Feature: 62861 SunnyCars dropoff location displays text properly

  As a traveler booking SunnyCars
  I want the dropoff location to display text instead of '0'
  So that I see meaningful location information

  Scenario: Verify SunnyCars dropoff location displays text
    Given I am logged in as "kaylesun@tlcfaketestsunnycar.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a car search at "Palma de Mallorca, (PMI) Spain"
    And I select the trip purpose as "BILLABLE" and proceed
    And I add the first car to cart
    And the booking status should be "Pending booking"
    And I click to edit the add location extras section
    And I select the first pickup location in the add location section
    And I open the drop-off location dropdown in the add location section
    Then all the drop-off location options in the add location section display text instead of only "0"
    When I select the first drop-off location in the add location section
    Then the selected drop-off location in the add location section displays text instead of only "0"
