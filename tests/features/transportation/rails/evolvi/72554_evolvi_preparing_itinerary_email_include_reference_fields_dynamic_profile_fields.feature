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
@transportation @rails @evolvi @regression
Feature: 72554 Evolvi - Preparing itinerary email includes reference fields and dynamic profile fields
  As a corporate traveler booking a UK Rail journey with Evolvi
  I want the itinerary email prepared for my trip to carry my reference fields and dynamic profile field values
  So that the delivered itinerary shows the booking references configured on my profile

  Scenario: Reference fields and dynamic profile field values appear in the Evolvi itinerary email
    Given I am logged in as "elisabete@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "licTo105"
    And I close mandatory notifications if displayed
    And I add an Evolvi one way to the trip
    And the booking status should be "Pending booking"
    When I fill mandatory Evolvi fields in cart
    And I proceed to checkout
    And I complete the booking
    And I successfully cancel the trip
    #TODO Then the received itinerary email should contain subject "Preparing Itinerary notification for Elisabete Ferreira on trip"
    And the received itinerary email should contain "Default field 4: LALAL"
