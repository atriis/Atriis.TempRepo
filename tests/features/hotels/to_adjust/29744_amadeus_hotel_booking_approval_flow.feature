# Test Name: 29744 MERGED amadeus value hotel E2E + add product during first approval flow + financial reference details are sent to the approvers + approval flow determined by the financial reference + hybrid for 22090
# Description: + HYBRID- 22090 Financial reference code and name are sent in the PNR remarks + HYBRID 2- 42717 Missing quotes details in cancel trip email + HYBRID 3 - 47619 remarks for Hotel room type, address, fax, city, postal code
# Status: Active
# Labels: Regression,Cars,Hotel,Approval flow,Full Purchase,Financial Reference Code,Email,NL government,Amadeus Value hotel,Amadeus,Pre Prod,Sanity,hybrid,Daily Hotels,66444 hotel results,Transportation,Giata,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-11-28T08:39:47Z
# Updated: 2025-12-08T07:47:37Z

@regression @provider:amadeus
Feature: 29744 Amadeus - Hotel booking with approval flow
  As a corporate traveler requiring manager approval
  I want to submit a hotel booking for approval
  So that my booking is authorized before being finalized

  @priority:critical
  Scenario: Hotel booking triggers approval flow with multiple approvers
    Given I am logged in as "amadeus" "shani_corp_nl" booking a new trip
    And I have added traveler by name "Shani Corp"
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the hotel should appear as refundable in cart
    When I proceed to checkout
    And I complete the booking
    # TODO: Create step "Then the booking should be sent for approval" that calls DSL method verifyApprovalSent in Checkout.js
    # TODO: Create step "Then the approval request should be visible to the approvers" that calls DSL verifyApprovalVisible
    # TODO: Create step "When the approver approves the booking" that calls DSL method approveBooking in Approval.js
    # TODO: Create DSL file Approval.js with methods: approveBooking, rejectBooking, verifyApprovalSent

