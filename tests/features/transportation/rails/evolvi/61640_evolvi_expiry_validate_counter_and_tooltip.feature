# Test Name: 61640 Evolvi> expiry - validate counter and tooltip
# Description: validate counter and tooltip
# Status: Active
# Labels: Regression,Rail,Evolvi,Expiry,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-05-06T10:04:42Z
# Updated: 2025-09-14T10:53:01Z
@transportation @rails @evolvi @regression
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
    And the booking status should be "Pending booking"
    Then the countdown clock is between 57 and 60 minutes
    When I hover the countdown clock
    # The tooltip states the supplier's STATIC hold window, not a live countdown: app-timed-quote.vue
    # renders `countdownDuration` whenever it is truthy, and uk-rail-quote-card always passes
    # UKRailCountdownDurationMinutes = 60 - so the sentence always reads "60 minutes" here, exactly as
    # Sunny Cars reads "15:00 minutes" (66558). The live MM:SS only ever appears in the badge itself.
    Then the countdown tooltip shows the message "Your session is valid for 60 minutes from the time of selection. We recommend completing your booking within this time to avoid changes in fare or availability."
