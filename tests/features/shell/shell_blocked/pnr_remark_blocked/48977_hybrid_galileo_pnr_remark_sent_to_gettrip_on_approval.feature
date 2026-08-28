# Test Name: HYBRID for 48977 PNR Remark when user click send for approval, remark sent to GetTrip
# Description: 
# Status: Active
# Labels: hybrid,Hotel,Cars,Full Purchase,Regression,Galileo,Approval flow,Approval for changes,Transportation,2026 plan 2
# Owner: Shani Hadar
# Created: 2024-11-17T11:53:19Z
# Updated: 2025-10-19T07:22:04Z

@regression @provider:galileo
Feature: 48977 Galileo - PNR remark sent to GetTrip when user sends booking for approval
  As a corporate traveler requiring approval for hotel and car bookings
  I want PNR remarks to be sent to GetTrip when submitting for approval
  So that the approval system has full context about the booking

  @priority:critical
  Scenario: PNR remark is sent to GetTrip when hotel booking is submitted for approval and car is added
    Given I am logged in as "remarks@gdgTest.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Denver" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    When I proceed to checkout
    And I click the send for approval button
    Then the booking status should be "Confirmed"
    #TODO: And I wait for 3 minutes
    # TODO: Create step "When I skip the approval flow approvers" that calls DSL skipApprovers in Approval.js - click modify, skip all and save
    #TODO: Then "No pending items - you're up to date." message is displayed
    #TODO: And I close the approvers dialog
    # TODO: Create or reuse step "When I search for a car from the cart" that calls DSL searchCarFromCart in Cart.js
    # TODO: Create step "When I add the first available car to my cart" that calls DSL addFirstCar in CarResults.js
    When I proceed to checkout
    And I click the send for approval button
