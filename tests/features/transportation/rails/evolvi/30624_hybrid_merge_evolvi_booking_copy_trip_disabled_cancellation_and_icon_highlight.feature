# Test Name: HYBRID for 30624 [Merge] Evolvi - Booking, copy trip disabled, cancellation and icon highlight
# Description:
# Status: Active
# Labels: Copy Trip,Full Purchase,Regression,hybrid,merge,Rail,Daily Transportation,Evolvi,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2024-01-02T12:42:13Z
# Updated: 2025-09-19T11:32:24Z
@transportation @rails @evolvi @regression @hybrid
Feature: 30624 [Merge] Evolvi - Booking, copy trip disabled, cancellation and icon highlight
  As a corporate traveler
  I want to book a one way Evolvi train and complete all mandatory cart details
  So that the rail quote cannot be copied and the booked trip can be cancelled

  Scenario: Evolvi one way booking with copy trip disabled and trip cancellation
    Given I am logged in as "elisabete@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "licTo105"
    And I acknowledge the push notification
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    When I select default delivery method and save
    # TODO: create step "When I fill in the Evolvi client reference fields in cart" in tests/steps/evolvi_results.steps.js
    # covers: expand the UK Rail client reference card, type "testim", "1234", "yes" and "temp" into its
    # free-text reference inputs and save the card - UK_Rail_Trip_Overview_Details()
    And I fill in the Evolvi client reference fields in cart
    And I fill mandatory Evolvi fields in cart
    # TODO: create step "Then the Reason for Non Lowest section should show the completed icon" in tests/steps/evolvi_results.steps.js
    # covers: after saving the Reason for Non Lowest card, its title loses the mandatory asterisk and the
    # card shows the completed/highlighted icon - Reason_for_Non_Lowest()
    Then the Reason for Non Lowest section should show the completed icon
    When I proceed to checkout
    And I complete the booking
    Then the trip should not be eligible for copy trip
    And I successfully cancel the trip
