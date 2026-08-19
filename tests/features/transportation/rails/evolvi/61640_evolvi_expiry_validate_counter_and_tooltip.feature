# Test Name: 61640 Evolvi> expiry - validate counter and tooltip
# Description: validate counter and tooltip
# Status: Active
# Labels: Regression,Rail,Evolvi,Expiry,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-05-06T10:04:42Z
# Updated: 2025-09-14T10:53:01Z
@transportation @rails @evolvi @regression @wip
Feature: 61640 Evolvi - Expiry validate counter and tooltip
  As a corporate traveler
  I want the expiry counter and its tooltip to show the time left on an Evolvi quote
  So that I know how long I have to complete the booking before the quote expires

  Scenario: Evolvi timed quote shows a live expiry counter and tooltip
    Given I am logged in as "thiagosantos@evolvi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Evolvi train from "182To115"
    And I acknowledge the push notification
    And I add an Evolvi one way to the trip
    Then the booking status should be "Pending booking"
    When I hover the countdown clock
    # TODO: read the live countdown text from the timed quote badge in the cart, parse it as MM:SS,
    # fail when it reads "Expired"/"Cart expired" or is unparsable, and assert the minutes left fall
    # inside the given window - a presence-only check passes on an already expired quote because the
    # live countdown and the expired state share the same container
    Then the timed quote badge counter should show between 1 and 20 minutes remaining
    Then the countdown tooltip shows the message "Your session is valid for MM:SS minutes from the time of selection. We recommend completing your booking within this time to avoid changes in fare or availability." with between 1 and 20 minutes remaining
