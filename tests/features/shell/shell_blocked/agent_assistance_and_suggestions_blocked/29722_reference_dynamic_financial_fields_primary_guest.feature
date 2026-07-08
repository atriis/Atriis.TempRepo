# Test Name: 29722 MERGED Reference and dynamic and financial fields on travel requests pop up are taken from the primary traveler - guest
# Description: reference & dynamic and financial fields on travel request pop up determined by primary traveler. in this test the primary is a guest - fields + content + editable + mandatory
# Status: Active
# Labels: Reference Fields,Dynamic fields,NL government,Request Assistance,Regression,guest,performance,No Amadeus Hotel Book,Financial Reference Code,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-12-20T09:01:24Z
# Updated: 2026-02-16T01:50:54Z

@regression @shell @request_assistance @dynamic_fields @hotel
Feature: 29722 - Reference, dynamic and financial fields on the travel request popup are taken from the primary traveler (guest)
  As a travel arranger booking a trip for a guest primary traveler
  I want the reference, dynamic and financial fields on the travel request popup to be driven by the primary traveler
  So that the correct mandatory, editable and pre-filled field values are enforced when sending the request to an agent

  Scenario: Reference and financial fields on the travel request popup follow the guest primary traveler
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added a guest traveler "Israel" "Israeli" with user group "Post Addis Ababa"
    And I have added traveler by name "pini cohen"
    And I search for a hotel in "LON" for 1 night without clicking search button
    And I click the request assistance icon
    And I click the send request button
    Then the reference fields popup should show the following labels:
      | Financial Reference |
      | Type of Trip |
      | Type of traveller |
      | Location travel policy |
      | Location |
      | Personnel number |
    And the travel request popup should show a reference section for traveler "Pini Cohen"
    And the reference fields popup should show the following labels:
      | Payment Group |
      | Bank account |
    And the travel request popup should show a reference section for traveler "Israel Israeli"
    And the reference fields popup should show the following labels:
      | Payment Group |
      | Bank account |
    And the number of reference and dynamic fields in the travel request popup should be 9
    And the reference fields should have the following values:
      | field | value |
      | Financial Reference | Select |
    When I open the financial reference dropdown in the travel request popup
    Then the financial reference dropdown should contain the following options:
      | uploadname7 (uploadcode7) |
      | uploadname5 (uploadcode5) |
      | uploadname6 (uploadcode6) |
    And the reference fields should have the following values:
      | field | value |
      | Type of Trip | Select |
      | Type of traveller | Select |
      | Location travel policy | Select |
      | Payment Group | Select |
    When I click proceed on the reference fields popup
    Then clicking proceed should show a mandatory field validation error
    When I select the first available option for the "Type of Trip" reference field
    And I select the first available option for the "Type of traveller" reference field
    And I select the first available option for the "Payment Group" reference field
    And I click proceed on the reference fields popup
    Then the financial reference modal title should be "Financial Reference"
    When I select the "Financial Reference" reference field as "uploadname7 (uploadcode7)"
    And I select the "Type of traveller" reference field as "Civil Expert"
    And I select the "Location" reference field as "ACCRA"
    And I fill in the "Personnel number" reference field with "123"
    And I fill in the "Bank account" reference field with "456"
    And I fill in the "Bank account" reference field with "789"
    Then the following reference fields should not be editable:
      | Financial Reference Code |
    And the reference fields should have the following values:
      | field | value |
      | Financial Reference | uploadname7 (uploadcode7) |
      | Type of Trip | Education and courses |
      | Type of traveller | Civil Expert |
      | Location travel policy | Netherlands |
      | Location | ACCRA |
      | Personnel number | 123 |
      | Payment Group | ALG |
      | Bank account | 456 |
      | Financial Reference Code | CBKI |
      | Bank account | 789 |
    And I save the reference field popup if displayed
    Then the "Sent to agent" confirmation should be displayed
