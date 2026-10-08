# Test Name: 86398 Galileo - Old Pricing Options screen offers Add to trip for a multi-carrier one-way fare
# Status: Active
# Labels: Flights,Galileo,Pricing Options,Multi carrier,Add to trip
# Owner: Yael Alef
# Created: 2026-10-08

# ADO Test Case ID: 86398
# ADO workitem ID: 85791 (Bug), related 85733
#
# Bug: on the old Pricing Options screen a Galileo one-way multi-carrier selection (prod: VY + EK,
# LH + CX) showed extra per-carrier tabs (e.g. SCQ-BCN, BCN-MNL) asking to select a fare, and no
# "Add to trip" button. The panel mixed the one-segment selection with two-segment separated-ticket
# combos; the OBT builds a tab per route shape but ends the wizard after the first row's segment count.
# Fixed in TMC2 PR 27061 (floor keeps only selection-shaped rows) and 881fb53f81 (whole-journey fares
# kept, separated combos compared by whole journey).
#
# Test data: beatrizpamplonacorp@galileo.com uses the old Pricing Options screen. SGN-EDI "Multi
# carrier" gives VN11 SGN-CDG + AF1686 CDG-EDI on dev. Dev Galileo returns no separated-ticket combos,
# so this guards the screen shape (one route tab, several fares, Add to trip), not the prod mix.
@ado:85791 @tc:86398 @regression @flights @galileo @pricing_options
Feature: 86398 Galileo - Old Pricing Options screen offers Add to trip for a multi-carrier one-way fare

  As a corporate traveler
  I want a multi-carrier one-way Galileo fare to price as one journey on the Pricing Options screen
  So that I can choose a fare and add it to my trip

  Scenario: Multi-carrier one-way SGN-EDI shows one route tab, several fares and Add to trip
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "SGN" to "EDI" in 30 days
    And flight results should be available
    And I filter airline results by "Multi carrier" checkbox
    And I click to open first pricing options
    Then there should be 1 elements matching css locator ".pricing-options-tabs .el-tabs__item"
    And the pricing options leg should offer more than one fare
    When I select the first option from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
