# Test Name: 56842 Ypsilon - 'Paid by TMC' is displayed when the TMC FOP is set as default, even though in the admin there are 2 FOP
# Description:
# Status: Active
# Labels: Ypsilon,FOP,Flights,Regression,paid by,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-17T11:01:35Z
# Updated: 2025-01-17T11:16:01Z

@regression @flights @ypsilon @fop @paid-by-tmc
Feature: 56842 Ypsilon - Paid by TMC is displayed when TMC FOP is set as default
  As a corporate traveler using Ypsilon with TMC FOP as default
  I want to see "Paid by TMC" in the cart payment section
  So that I know the correct form of payment is applied automatically

  Scenario: Paid by TMC label is visible in cart when TMC FOP is default
    Given I am logged in as "renatarosa@ypsilonspecifictestclub.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "BRS" to "BFS"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the payment type should be "Paid by TMC"
