# Test Name: 61657 Can not cancel quote 'In Progress'
# Description:
# Status: Active
# Labels: Daily Shell,Regression,trip cancelation,2026 plan 2
# Owner: Yael
# Created: 2025-05-06T01:38:15Z
# Updated: 2026-02-11T02:49:14Z

@regression @shell @trip-cancellation
Feature: 61657 - Can not cancel quote 'In Progress'
  As a corporate travel booker
  I want to verify that a trip cannot be canceled while a quote is in progress
  So that the system protects in-flight bookings from accidental cancellation

  Scenario: Trip cancellation is blocked when a quote is In Progress and individual items can still be canceled
    Given I am logged in as "inprogress@inprogress.com"
    When I navigate to trip 3735793
    Then I should see a quote with status "In progress"
    When I hover the trip actions menu
    Then the trip actions menu should show "Copy trip"
    When I hover the quote expand icon
    Then the cancel trip tooltip should say "Trip cannot be canceled while you have products in progress or finalizing."
    Then the cancel trip button should be disabled
    When I hover the item actions menu
    Then the item actions menu should show "Cancel item"
    When I hover the trip actions menu
    Then the trip actions menu should show "Copy trip"
    When I cancel the first item from the item actions menu
    Then the cancel trip button should be disabled
    When I hover the item actions menu
    Then the item actions menu should show "Cancel item"
    When I cancel the second item from the item actions menu
    Then the cancel trip button should be disabled
