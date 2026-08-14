# Test Name: 22999 MERGED benerail booking + approval flow for benerail cost, cabin class, destination, policy and policy rule
# Description: the trip goes to the right approvers in case benerail - cost, cabin class, destination, policy, policy rule
# +validate mobile barcode in cart and itinerary mail
# Status: Active
# Labels: Approval flow,Financial Reference Code,NL government,No Amadeus Hotel Book,Full Purchase,Pre Prod,Sanity,Bene seats,Daily Transportation,Benerail Moove Regression,Transportation,2026 plan 1,02
# Owner: Shani Hadar
# Created: 2023-11-28T09:14:11Z
# Updated: 2026-02-11T04:13:48Z
@wip @transportation @rails @benerail @regression @priority:critical
Feature: 22999 Benerail - Booking and approval flow for cost, cabin class, destination and policy rules
  As a corporate traveler under NL government policy
  I want to complete a Benerail round-trip booking that triggers approval flow
  So that the trip goes to the correct approvers and mobile barcode is validated

  Scenario: Benerail full booking with approval flow and mobile barcode validation
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added traveler by name "beny cohen"
    When I search for a round trip Benerail train from "bebmiToNlasc"
    And I click proceed button if visible
    When I add a Benerail round trip to the trip
    And the booking status should be "Pending booking"
    And I select OOP justification option "rail a"
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    When I select the "Financial Reference" reference field as "benerail1 (benerail1)"
    And I click proceed button if visible
    And I wait for booking details in checkout
    And I click the submit for approval button
    Then the approval confirmation message "Your order has been booked and sent to" should be displayed
    When I click go to trip button
    Then the trip overview should show the journey details button
    And I wait for 90 seconds
    And I refresh the page
    And the trip overview should show the journey details button
    And I wait for 10 seconds
    And I refresh the page
    Then I should see Benerail mobile barcode in trip overview
    When I click Benerail mobile barcode
    Then I should see the QR code
    And I close the Benerail mobile barcode dialog
    And I click the share itinerary button
    Then I wait to see "Subject" field in share dialog
    # Scrolls the preview iframe down to reach the barcode row, then closes the share itinerary dialog
    # so the approvals dialog below can be opened.
    Then Benerail mobile bar code in share itinerary is displayed
    When I view the approvers in the trip overview
    # Asserts the count and the names in one pass: the count step closes the approvals dialog when it
    # finishes, so it cannot be chained ahead of this one without reopening the dialog in between.
    Then the trip overview approvers should be:
    | Olga Cohen |
    | poli Cohen |
    | Bina Cohen |
    | Dina Brown |
    | mali Cohen |

