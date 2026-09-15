# ADO Test Case ID: 76009
@ado:76009
@regression @provider:sabre
Feature: 76009 Sabre - Hotel change dates modification
  As a corporate traveler with a booked Sabre hotel
  I want to change the dates of my hotel quote after booking
  So that I can review the price difference and re-book at the new, confirmed dates and price

  @priority:critical
  Scenario: Change the dates of a booked Sabre hotel quote and re-book at the new price
    Given I am logged in as "sabrin@orly.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a hotel search in "Washington" for 1 night
    And I wait to see view rates text in results page
    And I select the first hotel result
    And I add a refundable room to my cart
    And I extract the price at index 0 from "cart"
    And I extract the dates from cart
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"

    When I open the Change Dates option from the hotel quote menu
    Then the change dates page should open in the same tab
    When I select new hotel dates for 1 night 1 month from the original dates
    And I extract the new selected dates
    When I check availability for the new dates
    Then the availability summary should show the new dates
    And the original total should equal the extracted cart price
    And the difference should equal the updated total minus the original total
    When I extract the updated total price
    And I continue the date modification
    Then the booking status should be "Pending modification"
    And the hotel quote should show a modification countdown of about 30 minutes
    And a Cancel Modify button should be visible on the hotel quote
    And the hotel quote dates in cart should equal the extracted new dates
    And the price at index 0 from cart should match the extracted updated price

    And I wait for 30 seconds
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    And the price at index 0 from cart should match the extracted updated price
    And the hotel quote dates in cart should equal the extracted new dates

    Then I successfully cancel the trip with 60 seconds wait
