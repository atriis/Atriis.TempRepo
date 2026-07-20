# Test Name: 41117 Manual Quote - Ground transportation, Other with image in cart
# Status: Active
# Labels: Manual Quote,No Amadeus Hotel Book,additional fees,Club,Cart,performance,Groundscope Regression,progress page,Transportation,2026 plan 1
# Owner: Noam Miller
# Created: 2024-01-15T05:42:31Z
# Updated: 2025-09-30T07:56:11Z
@regression @manual_quote @transportation @groundtransport
Feature: 41117 Manual Quote - Ground transportation and Other quote with image in cart
  As a corporate traveler
  I want to add a ground transport manual quote and an Other manual quote with handling fee
  So that they appear correctly in the cart and after checkout

  @priority:high
  Scenario: Add ground transport and Other manual quotes, validate cart and checkout
    Given I am logged in as "manualQuote@testim.com" booking a new trip
    And I have added myself as the traveler
    When I add a ground transport manual quote with pickup "San Juan Island" dropoff "Seattle" vendor "aces transporation" phone "7183232323" vehicle "All Types" cancellation "test cancellation policy" confirmation "SJ-90885" base fare 29 and tax 10
    Then the booking status should be "On hold"
    When I click more details in cart
    Then I should see "Ground Transportation" quote in more details with pickup "San Juan Island", dropoff "Seattle", vendor "aces transporation", phone "7183232323", vehicle "All Types", cancellation "test cancellation policy", confirmation "SJ-90885", subtotoal 39
    And I close more details in cart
    When I navigate to the manual quote search page from the cart
    When I add a "Handling Fee" other manual quote with comment "3 full days" and base fare 15
    And I click the proceed to checkout button
    Then the "Handling Fee" quote should be visible in the checkout summary
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then the "Handling Fee" quote card should show a price of 15 dollars
    And the "Transport to" quote card should show a price of 39 dollars
    And I successfully cancel the trip



  