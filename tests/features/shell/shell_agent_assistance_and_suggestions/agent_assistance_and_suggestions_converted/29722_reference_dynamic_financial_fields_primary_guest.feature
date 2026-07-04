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
    And I have added a guest traveler "Israel" "Israeli" with user group "post berlin"
    And I have added traveler by name "pini cohen"
    # TODO: I select the hotel service tab in the request assistance form (TravelRequest.selectHotelTab in tests/steps/travel_request.steps.js)
    When I select the hotel service tab in the request assistance form
    # TODO: I type "London" in the request assistance hotel location field (HotelSearch.typeHotelLocation in tests/steps/hotel_search.steps.js)
    And I type "London" in the request assistance hotel location field
    # TODO: I confirm the request assistance hotel destination (TravelRequest.confirmHotelDestination in tests/steps/travel_request.steps.js)
    And I confirm the request assistance hotel destination
    # TODO: I select the hotel check-in and check-out dates in the request assistance form (TravelRequest.selectHotelDates in tests/steps/travel_request.steps.js)
    And I select the hotel check-in and check-out dates in the request assistance form
    # TODO: I confirm the hotel selection in the request assistance form (TravelRequest.confirmHotelSelection in tests/steps/travel_request.steps.js)
    And I confirm the hotel selection in the request assistance form
    # TODO: I scroll to the send request button in the request assistance form (TravelRequest.scrollToSendRequest in tests/steps/travel_request.steps.js)
    And I scroll to the send request button in the request assistance form
    # TODO: I send the request to the agent (TravelRequest.sendRequest in tests/steps/travel_request.steps.js)
    And I send the request to the agent
    Then the reference fields popup should show the following labels:
      | Financial Reference |
      | Type of Trip |
      | Type of traveller |
      | Location travel policy |
      | Location |
      | Personnel number |
    # TODO: the travel request popup should show a reference section for traveler "Pini Cohen" (DynamicAndReferenceFields.verifyTravelerSectionHeader in tests/steps/dynamic_fields.steps.js)
    And the travel request popup should show a reference section for traveler "Pini Cohen"
    And the reference fields popup should show the following labels:
      | Payment Group |
      | Bank account |
    # TODO: the travel request popup should show a reference section for traveler "Israel Israeli" (DynamicAndReferenceFields.verifyTravelerSectionHeader in tests/steps/dynamic_fields.steps.js)
    And the travel request popup should show a reference section for traveler "Israel Israeli"
    And the reference fields popup should show the following labels:
      | Payment Group |
      | Bank account |
    # TODO (manual): port the Testim validation-code-step (custom per-traveler reference-field validation) here
    And the reference fields should have the following values:
      | field | value |
      | Financial Reference | Select |
    # TODO: I open the financial reference dropdown in the travel request popup (DynamicAndReferenceFields.verifyFinancialReferenceOptions in tests/steps/dynamic_fields.steps.js)
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
      | Location | Select |
      | Payment Group | Select |
      | Financial Reference Code | CBKI |
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
    When I click proceed on the reference fields popup
    Then the "Sent to agent" confirmation should be displayed
