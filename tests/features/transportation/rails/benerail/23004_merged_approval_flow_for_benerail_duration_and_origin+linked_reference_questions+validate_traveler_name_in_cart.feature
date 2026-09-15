# Test Name: 23004 MERGED approval flow for benerail duration and origin + linked reference questions + validate traveler name in cart
# Description: the trip goes to the right approvers in case benerail - duration, origin
# Status: Active
# Labels: Approval flow,Financial Reference Code,NL government,No Amadeus Hotel Book,Full Purchase,Reference Fields,search,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1,02
# Owner: Shani Hadar
# Created: 2023-12-20T06:34:41Z
# Updated: 2026-02-03T09:44:16Z
@transportation @rails @benerail @regression
Feature: 23004 Benerail - Approval flow for duration and origin with linked reference questions and traveler name validation
  As a corporate traveler under NL government policy
  I want to complete a Benerail round-trip booking that triggers approval for duration/origin rules
  So that linked reference questions appear and traveler name is validated in cart

  Scenario: Benerail booking with approval flow for duration/origin and linked reference fields
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added traveler by name "bina"
    When I search for a round trip Benerail train from "nlbanToAmsterdamCe"
    Then the number of reference and dynamic fields in the travel request popup should be 5
    When I type "Posting" in reference field "Soort Reis/Type Of Trip" to select the first dropdown option
    Then the reference fields should have the following values:
    | field                                              | value  |
    | Checked Baggage?                                   | Select |
    | Odd Sized Baggage?                                 | Select |
    | Do You Need A Seat For An Infant?                  | Select |
    | Do You Need Us To Arrange Transportation Of A Pet? | Select |
    And the number of reference and dynamic fields in the travel request popup should be 9
    When I type "No" in reference field "Checked Baggage?" to select the first dropdown option
    Then the number of reference and dynamic fields in the travel request popup should be 9
    When I type "Yes" in reference field "Odd Sized Baggage?" to select the first dropdown option
    And I fill "Odd Sized Baggage Details" reference field pop up with "2"
    Then the number of reference and dynamic fields in the travel request popup should be 10
    When I type "No" in reference field "Do You Need A Seat For An Infant?" to select the first dropdown option
    And I type "No" in reference field "Do You Need Us To Arrange Transportation Of A Pet?" to select the first dropdown option
    Then the number of reference and dynamic fields in the travel request popup should be 10
    And I click proceed button if visible
    When I add a Benerail round trip to the trip
    Then the traveler "Bina Cohen" is available in cart page
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    When I select the "Financial Reference" reference field as "benerai2 (benerai2)"
    And I click proceed button if visible
    And I wait for booking details in checkout
    And I click the submit for approval button
    Then the approval confirmation message "Your order has been booked and sent to" should be displayed
    When I click go to trip button
    Then the trip overview should show the journey details button
    When I view the approvers in the trip overview
    # Asserts the count and the names in one pass: the count step closes the approvals dialog when it
    # finishes, so it cannot be chained ahead of this one without reopening the dialog in between.
    Then the trip overview approvers should be:
    | Pini Cohen |
    | Gadi Cohen |
