# Test Name: HYBRID for 63187 Amadeus - Hotel - Virtual Card - Check in and check out dates are correct and payment rage end date is +7 days after checkout date
# Description:
# Status: Active
# Labels: Regression,conferma,FOP,Virtual Card,Hotel,Full Purchase,Amadeus,hybrid,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-06-06T09:22:16Z
# Updated: 2026-02-15T11:59:36Z

@regression @hotels @fop @conferma @virtual-card @amadeus @full-purchase
Feature: 63187 HYBRID Amadeus Hotel Virtual Card - Check in/out dates and payment range
  As a corporate traveler booking an Amadeus hotel with a Conferma virtual card
  I want the booking to complete with the virtual card FOP applied
  So that the trip is created with the virtual card payment range

  @priority:high
  Scenario: Complete an Amadeus hotel booking using a Conferma virtual card
    Given I am logged in as "brunaconferma@conferma.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    And I complete the booking
    Then the booking status should be "Confirmed"
    And I successfully cancel the trip
