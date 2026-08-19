# Test Name: 72554 Evolvi - preparing itinerary email include reference fields/dynamic profile fields
# Description: Clone:
# Status: Active
# Labels: Full Purchase,Regression,Pre Prod,Rail,Evolvi,Fare Rules,Terms and Conditions,more details,Transportation,Bug ticket,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2026-01-13T04:28:03Z
# Updated: 2026-01-14T10:01:38Z
# Converted from Testim. The itinerary email is asserted on the delivered message, read back from
# the test mailbox — that step needs MAILBOX_* configured in .env, see .env.example.
# The Testim export left the email-validation step body empty, so the exact reference field labels
# and dynamic profile field values expected in the email still have to be established live.
@transportation @rails @evolvi @regression @wip
Feature: 72554 Evolvi - Preparing itinerary email includes reference fields and dynamic profile fields
  As a corporate traveler booking a UK Rail journey with Evolvi
  I want the itinerary email prepared for my trip to carry my reference fields and dynamic profile field values
  So that the delivered itinerary shows the booking references configured on my profile

  Scenario: Reference fields and dynamic profile field values appear in the Evolvi itinerary email
    Given I am logged in as "elisabete@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "licTo105"
    And I close mandatory notifications if displayed
    # TODO: open the fare rules of the first Evolvi fare in the results grid — hover the fare amount and click "Full information"; it must leave the current fare selection unchanged so the following add-to-trip step does not toggle the fare back off
    And I open the fare rules for the first Evolvi fare in results
    # TODO: assert the Evolvi fare rules dialog body contains the given text
    Then the Evolvi fare rules should contain "ticket"
    # TODO: close the Evolvi "Full information" fare rules dialog and return to the results grid
    When I close the Evolvi fare rules dialog
    And I add an Evolvi one way to the trip
    Then the cart status should be Pending booking
    When I click on the terms and conditions link in the cart
    Then the cart terms and conditions should include "ticket"
    When I close the terms and conditions modal
    And I select default delivery method and save
    And I proceed to checkout
    And I wait for booking details in checkout
    And I complete the booking
    When I click the share itinerary button
    And I wait to see "Subject" field in share dialog
    And I add a generated email address as the itinerary recipient
    And I send the email and see success notification
    # TODO: assert the delivered itinerary email contains the reference field labels and the dynamic profile field values held on the traveller profile — the expected labels and values must be confirmed against a live run for this account before this can use the existing "the received itinerary email should contain {string}" step
    Then the received itinerary email should include the reference fields and dynamic profile field values
    When I open the trip cancellation from the trip actions menu
    Then the trip cancellation dialog should be displayed
    And I confirm the trip cancellation successfully
