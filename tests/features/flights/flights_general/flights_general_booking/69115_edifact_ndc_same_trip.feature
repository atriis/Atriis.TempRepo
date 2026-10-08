# Test Name: 69115: Both quotes confirmed when booking EDIFACT and NDC in the same trip
# Status: Active
# Labels: Sabre,Sabre NDC,separate tickets,by schedule,Gray Dawes,Daily Flights,Flights,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-10-21T09:30:38Z
# Updated: 2025-11-04T07:13:59Z

@regression @flights @general @sabre @ndc @full-purchase
Feature: 69115 Flights - Both quotes confirmed when booking EDIFACT and NDC in same trip
  As a corporate traveler
  I want both EDIFACT and NDC quotes to be confirmed in a single trip
  So that mixed-supplier bookings work correctly

  Scenario: EDIFACT and NDC booking in same trip are both confirmed
    Given I am logged in as "69059@regression.gdg" booking a new trip
    And I have added a random guest traveler
    When I search for a flight by schedule from "CPH" to "LON"
    And I filter results by carrier "BA"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I filter results by carrier "SK"
    Then the "NDC Direct Rate" indicator should be visible in results
    When I select one flight segment by schedule
    And I wait for "Your Selection" text to be visible
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    And I accept all Terms & Conditions on the page
    And I click the proceed to checkout button
    And I wait for booking details in checkout
    Then "Flight to London" should be displayed in the checkout page
    And "Flight to Copenhagen" should be displayed in the checkout page
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    And all quotes should have PNR codes
