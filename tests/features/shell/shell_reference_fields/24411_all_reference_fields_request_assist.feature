# Test Name: 24411 All Reference fields request assist
# Description: Check all Reference fields in request assistance stage
# Status: Active
# Labels: piniTest,Fit for Prod,Request Assistance,Hotel,No Amadeus Hotel Book,Reference Fields,Regression,Daily Shell,2026 plan 1
# Owner: pini harush
# Created: 2023-02-12T02:21:21Z
# Updated: 2025-09-11T12:40:10Z

@shell @reference_fields @regression @request_assistance
Feature: 24411 - All reference fields in the request assistance stage

  As a booker using request assistance
  I want all configured reference fields to appear during the request assistance stage
  So that I can supply the required reference information before submitting the request

  Scenario: All reference fields are displayed during a hotel request assistance
    Given I am logged in as "Rf@testim.nl" booking a new trip
    And I search for a hotel in "LON" for 1 night without clicking search button
    And I click the request assistance icon
    And I click the send request button
    Then the reference fields popup should show the following labels:
    | New Trip Rf |
