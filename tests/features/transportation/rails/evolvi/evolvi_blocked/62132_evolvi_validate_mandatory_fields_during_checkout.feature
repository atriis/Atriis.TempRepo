# Test Name: 62132 Evolvi> Validate mandatory fields during checkout
# Description: Validate mandatory fields
# Status: Active
# Labels: Rail,Evolvi,Regression,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-05-15T05:42:46Z
# Updated: 2025-09-17T12:04:43Z
@transportation @rails @evolvi @regression @wip
Feature: 62132 Evolvi - Validate mandatory fields during checkout
  As a rail booker
  I want the proceed to checkout button to stay disabled until every mandatory Evolvi extras field is filled
  So that a UK rail booking can never be sent to checkout with missing mandatory information

  #Blocked: "Reason for Non Lowest" not displayed
  Scenario: Delivery method, seating and reason for non lowest fare are mandatory before checkout
    Given I am logged in as "corp@evolvi32.com" booking a new trip
    And I have added myself as the traveler
    And I search for a one way Evolvi train from "182To115"
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    When I click the proceed to checkout button
    Then the proceed to checkout button should be disabled
    And the "Delivery Method" section should be visible in the extras highlighted and with red asterisk
    And the "Seating" section should be visible in the extras highlighted and with red asterisk
    And the "Reason for Non Lowest" section should be visible in the extras highlighted and with red asterisk
    And I fill in "Delivery Method" section
    And I fill in "Seating" section
    And I fill in "Reason for Non Lowest" section
    Then "Delivery Method", "Seating" and "Reason for Non Lowest" have green check marks
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    Then I wait for booking details in checkout

  Scenario: Client reference is mandatory before checkout in addition to the other Evolvi extras
    Given I am logged in as "eve@levi.com" booking a new trip
    And I have added myself as the traveler
    And I search for a one way Evolvi train from "182To115"
    And I close mandatory notifications if displayed
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    # Then the following fields have been filled in and saved correctly- Delivery Method- Seating- Reason for Non Lowest- Client Reference (New Mandatory field)- Terms &amp; Conditions&nbsp;all have the green mark
    And I proceed to checkout
    Then I wait for booking details in checkout