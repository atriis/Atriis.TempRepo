# Test Name: 23109 - Ehotel - book successfully and "provided by" appears in results and cart
# Description: book Ehotel
# Status: Active
# Labels: Hotel,No Amadeus Hotel Book,Full Purchase,retries,Keeps failing,Ehotel Regression,Daily Hotels,Pre Prod,Giata,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-02-14T08:06:35Z
# Updated: 2026-02-22T08:46:41Z

@regression @provider:ehotel
Feature: 23109 eHotel - Book hotel and verify provider label
  As a corporate traveler using eHotel
  I want to book a hotel and see the correct provider information displayed
  So that I know which platform is providing the hotel content

  @priority:high
  Scenario: eHotel label is displayed and booking completes successfully
    Given I am logged in as "eli" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I wait for the first add to trip button in room level results to be visible
    Then I should see a provided by label in room level results
    And I add a refundable room to my cart
    Then I should see a provided by label in cart
    When I fill credit card cvv if needed
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip
