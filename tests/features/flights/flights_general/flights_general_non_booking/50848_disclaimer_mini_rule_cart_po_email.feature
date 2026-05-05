# Test Name: 50848 Add disclaimer to Mini Rule icon cart and to PO email
# Description: added- validation in PO mail
# Status: Active
# Labels: Regression,Flights,mini rule,Cart,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-10-23T08:29:49Z
# Updated: 2025-01-06T10:49:49Z

@regression @flights @general @cart @mini-rule
Feature: 50848 Flights - Disclaimer in mini rule icon cart and PO email
  As a corporate traveler
  I want to see the fare rules disclaimer in the price breakdown and price offer email
  So that I am aware that airline rules prevail

  Scenario: Disclaimer is displayed in price breakdown and price offer email
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    And I filter results by carrier "BA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I click to open price breakdown in cart
    Then the mini rule disclaimer in price breakdown should contain "In case displayed fees differ from the airline's fare rules, the airline's rules will prevail"
    When I close price breakdown modal
    And I click the share quote button
    Then "* in case displayed fees differ from the airline's fare rules, the airline's rules will prevail" should be displayed in the share email preview
    When I switch the share email preview to detailed view
    Then "* in case displayed fees differ from the airline's fare rules, the airline's rules will prevail" should be displayed in the share email preview
    And I close the share dialog

