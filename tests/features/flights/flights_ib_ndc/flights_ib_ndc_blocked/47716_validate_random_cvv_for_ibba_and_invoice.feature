# Test Name: 47716 Validate random CVV for IB/BA and invoice
# Description: 1. INV by default - no cvv needed
#              2. change to CC with random cvv - no cvv needed
#              3. change for CC without random cvv - cvv needed
# Status: Active
# Labels: Flights,No Amadeus Hotel Book,Iberia,CVV,Random CVV,Regression,2026 plan 1
# Owner: pini harush
# Created: 2024-06-26T03:06:34Z
# Updated: 2024-11-12T07:54:20Z

@regression @flights @iberia @ndc @cvv @random-cvv @fop
Feature: 47716 Iberia - Validate random CVV for IB/BA and invoice
  As a corporate traveler
  I want CVV to be required only for credit cards without random CVV configured
  So that invoice and random-CVV cards do not prompt for CVV unnecessarily

  #BLOCKED - no results, could not test the entire scenario 
  Scenario: CVV requirement varies by FOP type for IB NDC booking
    Given I am logged in as "cvv_ib" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "MAD" to "LON"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the payment type should be "Paid by TMC"
    Then the CVV field should not be displayed
    When I click to edit the card
    And I select card 2 and save
    Then the payment type should be "Paid by Corporate"
    Then the CVV field should not be displayed
    When I click to edit the card
    And I select card 3 and save
    And I fill CVV with "123"
