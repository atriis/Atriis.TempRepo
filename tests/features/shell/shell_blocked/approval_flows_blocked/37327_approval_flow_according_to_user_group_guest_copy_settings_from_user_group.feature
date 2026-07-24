# Test Name: 37327 Approval flow according to user group - Guest, Copy settings from User Group
# Description:
# Status: Active
# Labels: Regression,Approval flow,2026 plan 1
# Owner: Noam Miller
# Created: 2023-10-25T01:06:49Z
# Updated: 2026-02-16T01:44:55Z

@regression @shell @approval_flow @cars
Feature: 37327 - Approval flow according to user group - Guest, Copy settings from User Group
  As an agent booking on behalf of a guest traveler
  I want to add a guest whose settings are copied from a user group and book a car requiring approval
  So that the approval flow assigns the correct approvers from that user group
  
  #This test keeps failing because admin configuration, need to talk to Pini
  Scenario: Book a car for a guest copying settings from the user group and send for approval
    Given I am logged in as "fabian@apflow.mx" booking a new trip
    And I have added a random guest traveler not as primary with copying settings from the user group "Jalisco"
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
    Then the approver "Fabian Jaimes" should be assigned to the approval flow
    And the approver "Victor Alvarez" should be assigned to the approval flow
    Then I successfully cancel the trip
