# Test Name: 56125 Restrict Use of Premier Inn Business Account Credentials for Bookings Outside the UK
# Description: validate that in case of premier inn hotel outside of GB we don't see the ATOS card in cart (see the card from the corporate - paid by corporate and not paid by tmc)
# Status: Active
# Labels: Premier Inn Regression,Hotel,FOP,Cart,No Amadeus Hotel Book,2026 plan 1
# Owner: Shani Hadar
# Created: 2025-01-02T09:59:01Z
# Updated: 2025-09-25T06:58:24Z

@regression @provider:premierinn
Feature: 56125 Premier Inn - Corporate booking outside UK does not use ATOS card
  As a corporate traveler booking a Premier Inn outside the UK
  I want to see that the ATOS card is not available and that billing is "Paid by Corporate"
  So that correct payment rules are enforced for non-UK Premier Inn locations

  @priority:high
  Scenario: ATOS card not available and Paid by Corporate shown for non-UK Premier Inn
    Given I am logged in as "premier" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "FRA" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the payment type should be "Paid by Corporate"

