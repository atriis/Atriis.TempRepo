# ADO #82572 - [UK Rail][Evolvi] Cancellation Flow Corrections
# Reference: User Story #82572
# TC-1 (happy-path, critical) generated from the User Story - see e2e-test-pipeline Phase 1C
# ADO Test Case ID: 84769
@ado:84769
@regression @transportation @rails @provider:evolvi @ado:82572 @priority:critical
Feature: 84769 UK Rail (Evolvi) - Cancel Item popup shows disclaimer and sends corrected OTA_CancelRQ
  As a corporate traveler or agent cancelling a confirmed UK Rail (Evolvi) booking
  I want a clear disclaimer that only e-ticket cancellations are supported
  So that I know to confirm cancellation and refund status with support, while the cancellation request itself is still sent correctly to Evolvi

  Scenario: Cancel Item popup discloses e-ticket cancellation support and sends a corrected OTA_CancelRQ
    Given I am logged in as "elisabete@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "licTo105"
    And I acknowledge the push notification
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    When I select the "eTicket Queue" delivery method and save
    And I fill mandatory Evolvi fields in cart
    When I proceed to checkout
    And I complete the booking
    And the booking status should be "Ticketing Complete"
    When I open the cancel item dialog for the item at index 0
    Then the Evolvi cancellation disclaimer should be displayed
    When I confirm the open cancel item dialog
    #Then I cancel the trip successfully
    When I capture the "request" payload for request type "otaCancel" from Storage
    Then the captured "request" payload for request type "otaCancel" should contain "CancelForRefund".onKey("CancelType")
    And the captured "request" payload for request type "otaCancel" should contain "Test Booking".onKey("Reason")
    And the captured "request" payload for request type "otaCancel" should contain "OrderItemID".block("UniqueID")
    Then the captured "block" payload for request type "otaCancel" should not contain "Reason"

  Scenario: Cancel Item popup discloses e-ticket cancellation support even when the attempt fails for a non-eTicket booking
    Given I am logged in as "elisabete@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "licTo105"
    And I acknowledge the push notification
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    When I select default delivery method and save
    And I fill mandatory Evolvi fields in cart
    When I proceed to checkout
    And I complete the booking
    And the booking status should be "Ticketing Complete"
    When I open the cancel item dialog for the item at index 0
    Then the Evolvi cancellation disclaimer should be displayed
    When I confirm the open cancel item dialog
    Then the cancel item attempt should fail
    And the cancel item error message should read "Failed to cancel the item"
