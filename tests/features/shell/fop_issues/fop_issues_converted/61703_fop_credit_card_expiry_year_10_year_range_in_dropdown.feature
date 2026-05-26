# Test Name: 61703 FOP - Credit card expiry date displays a 10-year range in the dropdown
# Description:
# Status: Active
# Labels: FOP,Regression,credit card,Expiry,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-08T10:23:04Z
# Updated: 2025-05-08T10:56:54Z

@regression @flights @fop @credit-card @expiry
Feature: 61703 FOP - Credit card expiry year dropdown displays a 10-year range
  As a corporate traveler adding a new credit card
  I want the expiration year dropdown to show 10 selectable years
  So that I can choose any valid expiry year for my card

  @priority:medium
  Scenario: Expiration year dropdown displays 10 entries starting with "2"
    Given I am logged in as "ruimendes@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "MAN" to "HEL"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    And I click add card details button
    # TODO: new step in cart_fop.steps.js — click expiry year dropdown (.el-select__wrapper for year field)
    And I open the credit card expiration year dropdown
    # TODO: new step in cart_fop.steps.js — assert exactly 10 li.el-select-dropdown__item entries whose text starts with '2'
    Then the credit card expiration year dropdown should display 10 entries starting with "2"
