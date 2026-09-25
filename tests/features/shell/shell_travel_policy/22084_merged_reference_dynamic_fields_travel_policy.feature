# Test Name: 22084 MERGED reference fields and dynamic fields and travel policy and financial reference codes are taken from the primary traveler - 1 guest as primary and 1 corp user
# Description:
# Status: Active
# Labels: Financial Reference Code,NL government,Hotel,Regression,No Amadeus Hotel Book,guest,Dynamic fields,Reference Fields,Travel policy,Pre Prod,Daily Shell,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-01T09:38:34Z
# Updated: 2026-02-04T12:30:56Z

@regression @travel_policy @dynamic_fields @reference_fields @financial_reference @hotel @daily_shell @shell @priority:high
Feature: 22084 Travel Policy - Reference fields, dynamic fields and financial reference from primary traveler

  As a travel arranger
  I want the system to take reference fields, dynamic fields, and travel policy from the primary traveler
  So that the correct corporate policies and fields are applied based on the primary guest

  Scenario: Guest as primary traveler - reference fields, dynamic fields, travel policy and financial reference codes
    Given I am logged in as "Shani@Testimcorpnl.com" booking a new trip
    And I have added a guest traveler "Israel" "Israeli" with user group "Post Addis Ababa"
    And I have added traveler by name "Shani Cohen"
    When I initiate a hotel search in "London, UK" for 1 night
    Then the reference fields popup should show the following labels:
      | Type of Trip             |
      | Type of traveller        |
      | Location travel policy   |
      | Location                 |
      | Personnel number         |
    And the reference fields should have the following values:
      | field                    | value  |
      | Type of Trip             | Select |
      | Type of traveller        | Select |
      | Location travel policy   | Select |
      | Location                 | Select |
    When clicking proceed should show a mandatory field validation error
    When I select the "Type of Trip" reference field as "Annual leave"
    And I select the "Type of traveller" reference field as "Election observer"
    And I select the "Location travel policy" reference field as "Netherlands"
    And I select the "Location" reference field as "ABU DHABI"
    And I fill in the "Personnel number" reference field with "123"
    And I click proceed on the reference fields popup
    And I wait for hotel results to load
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Hotel cost per night is greater than or equals 30 EUR"
    When I navigate back to hotel level results via breadcrumb
    When I wait to see view rates text in results page
    And I select the first hotel result
    And I add a refundable room to my cart
    And I fill in the OOP justification text "abc"
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    Then the financial reference dropdown should contain the following options:
      | uploadname7 (uploadcode7) |
      | uploadname5 (uploadcode5) |
      | uploadname6 (uploadcode6) |
