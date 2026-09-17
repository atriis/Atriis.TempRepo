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
    And the reference fields for traveler "Pini Cohen" should have the following values:
      | field | value |
      | Payment Group | CBKI |
      | Bank account |  |
    And the travel request popup should show a reference section for traveler "Israel Israeli"
    And the reference fields for traveler "Israel Israeli" should have the following values:
      | field | value |
      | Payment Group | ADD |
      | Bank account |  |
    And the number of reference and dynamic fields in the travel request popup should be 10
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
      | Location travel policy | Caribbean |
      | Personnel number |  |
    And I save the reference field popup if displayed
    Then the financial reference should be marked as invalid
    And the custom error "This field is required" should be displayed below the "Type of Trip" reference field
    When I select the "Financial Reference" reference field as "uploadname7 (uploadcode7)"
    And I select the first available option for the "Type of Trip" reference field
    And I select the first available option for the "Location travel policy" reference field
    And I select the first available option for the "Payment Group" reference field for traveler "Israel Israeli"
    And the reference fields should have the following values:
      | field | value |
      | Financial Reference | uploadname7 (uploadcode7) |
      | Type of Trip | Annual leave |
      | Location travel policy | Caribbean |
    And the reference fields for traveler "Israel Israeli" should have the following values:
      | field | value |
      | Payment Group | ADD |
    And the reference fields for traveler "Pini Cohen" should have the following values:
      | field | value |
      | Payment Group | CBKI |
    And I save the reference field popup if displayed
    Then the "Sent to agent" confirmation should be displayed
