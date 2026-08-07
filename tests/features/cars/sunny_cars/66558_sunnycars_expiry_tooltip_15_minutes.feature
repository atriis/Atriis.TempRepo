# Test Name: 66558- SunnyCars> expiry fix number of minutes in the tool tip- 15
# Labels: Cars, SunnyCars Regression, location, Regression
# Owner: pini harush
# Created: 2025-09-07T01:23:06Z
# Updated: 2026-01-06T01:10:34Z

@regression @cars @sunnycars @expiry @transportation
Feature: 66558 SunnyCars - Expiry tooltip 15 minutes validation 

  As a SunnyCars traveler
  I want the expiry tooltip to show the correct number of minutes
  So that I know when my quote will expire

  @priority:high
  Scenario: Verify SunnyCars expiry tooltip shows 15 minutes
    Given I am logged in as "kaylesun@tlcfaketestsunnycar.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a car search at "Palma de Mallorca, (PMI) Spain"
    And I select the trip purpose as "BILLABLE" and proceed
    And I add the first car to cart
    And the booking status should be "Pending booking"
    When I hover the countdown clock
    Then the countdown tooltip shows the message "Your session is valid for 15:00 minutes from the time of selection. We recommend completing your booking within this time to avoid changes in fare or availability."
