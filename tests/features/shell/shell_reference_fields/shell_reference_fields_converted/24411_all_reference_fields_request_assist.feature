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
    # TODO: implement step - open hotel request-assistance tab, enter destination, pick check-in/out dates, search
    When I request assistance for a hotel in "London,United Kingdom,(LON)"
    # TODO: implement step - click the primary submit/continue button that opens the request-assistance reference-fields stage
    And I submit the request assistance
    # TODO: implement step - was a Testim html-attr-validation (not exportable); assert every configured reference field is present (poll; values settle after render)
    Then all reference fields are displayed in the request assistance stage
    # TODO: implement step - close the request assistance dialog
    And I close the request assistance dialog
