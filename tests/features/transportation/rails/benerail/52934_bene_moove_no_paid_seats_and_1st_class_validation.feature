# Test Name: 52934 Bene Moove no paid seats and 1st class validation
# Description: in case there are no paid seats - show only close button and don't act like paid seats
# Status: Active
# Labels: No Amadeus Hotel Book,Benerail Moove Regression,Bene seats,Rail,Transportation,2026 plan 1
# Owner: pini harush
# Created: 2024-10-28T06:48:43Z
# Updated: 2025-12-23T04:39:02Z
@wip @transportation @rails @benerail @regression
Feature: 52934 Benerail - No paid seats and 1st class booking validation
  As a corporate traveler
  I want to select a 1st class seat when no paid seats are available
  So that the seating selector shows only the close button and does not behave like paid seats

  Scenario: Benerail 1st class booking with no-paid-seats seating validation
    Given I am logged in as "beny@benerail.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToDefra"
    And I click proceed on the reference fields popup
    When I select the first Benerail option
    # TODO: create step "When I verify the second result is in 2nd class" in benerail_results.steps.js
    # covers: waitForText on second result's class info to show '2nd Class'
    Then the second Benerail result should show "2nd Class"
    # TODO: create step "When I select the second Benerail result" in benerail_results.steps.js
    # covers: page.click(".rail-list > section:nth-of-type(2) [class^='btn--width']...")
    When I select the second Benerail result
    When I select the first Benerail option
    # TODO: create step "When I expand the 1st class options for the first Benerail result" in benerail_results.steps.js
    # covers: page.click on first result's class options expand button
    When I expand the 1st class options for the first Benerail result
    # TODO: create step "Then the 1st class alternative should be visible for the first result" in benerail_results.steps.js
    # covers: waitForText on ".rail-list > :nth-child(1)..." to show /1st Class/
    Then the 1st class alternative should be visible for the first result
    # TODO: create step "When I select the 1st class Benerail option and add to trip" in benerail_results.steps.js
    # covers: click 1st class btn--primary then add-to-trip btn--primary then pending wait
    When I select the 1st class Benerail option and add to trip
    # TODO: create step "Then the cart should show 1st Class for the Benerail booking" in benerail_results.steps.js
    # covers: waitForText(".ticket-details >... .rail-class", '1st Class')
    Then the cart should show "1st Class" for the Benerail booking
    # TODO: create step "When I open the Benerail seat selection in cart" in benerail_results.steps.js
    # covers: click Seating section, scroll to close button, click checkbox, click Book+Finalize tab
    When I open the Benerail seat selection in cart
    # TODO: create step "Then the Book and Finalize button should be visible in the Benerail seat dialog" in benerail_results.steps.js
    # covers: waitForText on Book and Finalize btn
    Then the Book and Finalize button should be visible in the Benerail seat dialog
