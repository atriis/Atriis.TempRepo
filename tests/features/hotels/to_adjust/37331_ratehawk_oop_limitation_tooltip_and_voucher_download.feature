# Test Name: 37331 [Merge] Ratehawk - OOP hotel limitation works as expected and voucher is displayed only after booking
# Description: 
# Status: Active
# Labels: Ratehawk Regression,Hotel,Full Purchase,hotel limitations,Travel policy,merge,progress page,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-02-07T07:18:06Z
# Updated: 2025-03-17T11:03:41Z

@regression @provider:ratehawk
Feature: 37331 Ratehawk - OOP limitation tooltip and voucher download
  As a corporate traveler using Ratehawk with out-of-policy restrictions
  I want to see the OOP limitation tooltip and download a voucher after booking
  So that I understand policy constraints and have proof of my booking

  @priority:high
  Scenario: OOP limitation tooltip is displayed and voucher can be downloaded after booking
    Given I am logged in as "lidi" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "123 Champs-Élysées" for 1 night
    And I select the first hotel result
    # TODO: Create step "Then the OOP limitation tooltip should be visible on hover in room level" that calls DSL verifyOOPLimitationTooltip in RoomLevelResults.js
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    # TODO: Create step "When I download the hotel voucher" that calls DSL method downloadVoucher in Trip.js
    # TODO: Create step "Then the voucher should be downloaded successfully" that calls DSL method verifyVoucherDownloaded in Trip.js

