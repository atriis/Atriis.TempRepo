# Test Name: 37321 Approval flow according to traveler - I'm the traveler
# Description:
# Status: Active
# Labels: Regression,Approval flow,2026 plan 1
# Owner: Noam Miller
# Created: 2023-10-25T11:20:57Z
# Updated: 2026-02-16T01:43:18Z

@regression @shell @approval_flow @cars
Feature: 37321 - Approval flow according to traveler - I'm the traveler
  As a travel arranger who is also the traveler
  I want to book a car that triggers an approval flow based on the traveler
  So that the trip is sent to the correct approver and shows an active approval

  Scenario: Book a car as the traveler and validate the traveler-based approval flow
    Given I am logged in as "fabian@apflow.mx" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LGW"
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    And I wait for booking details in checkout
    And I click the submit for approval button
    Then the approval confirmation message "Your order has been booked and sent to" should be displayed
    When I click go to trip button
    And the booking status should be "Confirmed"
    And I view the approvers in the trip overview
    Then the approver "Jacqueline Luna-Castro" should be assigned to the approval flow
    And I successfully cancel the trip
