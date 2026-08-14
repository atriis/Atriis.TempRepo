# Test Name: 52934 Bene Moove no paid seats and 1st class validation
# Description: in case there are no paid seats - show only close button and don't act like paid seats
# Status: Active
# Labels: No Amadeus Hotel Book,Benerail Moove Regression,Bene seats,Rail,Transportation,2026 plan 1
# Owner: pini harush
# Created: 2024-10-28T06:48:43Z
# Updated: 2025-12-23T04:39:02Z
@transportation @rails @benerail @regression
Feature: 52934 Benerail - No paid seats and 1st class booking validation
  As a corporate traveler
  I want to select a 1st class seat when no paid seats are available
  So that the seating selector shows only the close button and does not behave like paid seats

  Scenario: Benerail 1st class booking with no-paid-seats seating validation
    Given I am logged in as "pmac@bene.ral" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Benerail train from "bebmiToDefra"
    And I wait for select text to be visible
    When I select the first Benerail option
    And I wait to see the change button on the selected Benerail leg
    And I expand more options for the first result
    And I select a Benerail "1st Class" from more options
    And I click Benerail add to trip button
    And the booking status should be "Pending booking"
    Then the cart should show "2nd Class" for the Benerail outbound in cart
    Then the cart should show "1st Class" for the Benerail inbound in cart
    When I click Benerail seating in extras
    And I click outbound and inbound seat checkboxes
    And I extract outbound and inbound seat prices
    And I click the save button
    And the booking status should be "Pending booking"
    Then the seating price in the Benerail cart summary is the sum of outbound and inbound seats
    And I fill in the OOP justification text "abc"
    When I proceed to checkout
    Then I wait for booking details in checkout
