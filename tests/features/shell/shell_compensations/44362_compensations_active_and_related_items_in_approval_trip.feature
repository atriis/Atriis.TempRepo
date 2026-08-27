# Test Name: 44362 Compensations active and related items- in approval trip
# Description:
# Status: Active
# Labels: Regression,Cart,Approval flow,Amadeus,Flights,Compensation,Full Purchase,2026 plan 1
# Owner: pini harush
# Created: 2024-04-02T10:14:01Z
# Updated: 2025-07-21T03:06:46Z

@regression @shell @compensation @approval_flow @flights @provider:amadeus @full_purchase
Feature: 44362 Amadeus - Compensations active and related items in an approval trip
  As a corporate traveler whose company has climate compensation switched on
  I want the Climate Contribution quote to be purchased alongside my flight and to stay linked to it
  So that the compensation is priced into the total, survives the approval flow, and is listed when the trip is cancelled

  Scenario: Purchase a flight with an active climate contribution and verify it through approval and cancellation
    Given I am logged in as "Compensations@active.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "DOH"
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    Then the "Climate Contribution" compensation quote should be displayed in cart
    And "Climate Contribution" compensation quote does not have an add to cart button
    When I open the compensation terms and conditions
    Then the compensation terms should state that the purchase is non-refundable
    When I close the compensation terms and conditions dialog
    And I accept all Terms & Conditions on the page
    And I click the proceed to checkout button
    And I validate price change if displayed and proceed
    And I wait for booking details in checkout
    Then the checkout summary should show the "Carbon offset" line
    When I extract the flight amount from the checkout summary
    And I extract the carbon offset amount from the checkout summary
    And I extract the total amount from the checkout summary
    Then the checkout summary total should equal the flight amount plus the carbon offset amount
    When I send booking for approval
    Then the compensation quote should be visible after booking
    And the quote status is "On Hold"
    Then the trip status should be "In approval"
    And the flight quote title should start with "Flight to"
    When I view the approvers in the trip overview
    And I approve all pending items in the approval flow dialog
    Then the approval flow should show no pending items
    When I close the approval flow dialog
    And I refresh the page
    Then the flight booking status should be "Finalising" or "Confirmed"
    And the compensation booking status should be "On hold" or "Confirmed"
