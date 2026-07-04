# Test Name: 37104 MERGED reference and dynamic and financial on travel request pop up are taken from the primary traveler (booker) + cc email is sent
# Description:
# Status: Active
# Labels: Request Assistance,Email,Regression,Reference Fields,Dynamic fields,NL government,No Amadeus Hotel Book,Financial Reference Code,Hotel,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-12-12T12:50:10Z
# Updated: 2026-02-10T05:14:39Z

@regression @shell @request_assistance @email @dynamic_fields @hotel
Feature: 37104 - Reference, dynamic and financial fields on the travel request popup are taken from the primary traveler (booker) and a CC email is sent
  As a booker sending a travel request for assistance
  I want the reference, dynamic and financial fields to be pre-filled from the primary traveler (booker) and a CC email to be delivered
  So that the agent receives the correct policy data and the CC recipient is notified

  Scenario: Reference fields on the travel request popup reflect the booker and a CC email is sent
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added myself as the traveler
    When I click the request assistance icon
    # TODO: I fill the request assistance flight search from "lon" to "par" (Search.fillRequestAssistanceFlightSearch (new) in tests/steps/search.steps.js)
    And I fill the request assistance flight search from "lon" to "par"
    # TODO: I generate a unique email address for the CC field (emailHelper.generateUniqueEmail (new) in tests/steps/travel_request.steps.js)
    And I generate a unique email address for the CC field
    # TODO: I fill the CC email field with a generated email address (TravelRequestPage.fillCcEmail (new) in tests/steps/travel_request.steps.js)
    And I fill the CC email field with a generated email address
    # TODO: I submit the request assistance to open the reference fields popup (TravelRequestPage.clickSendRequestButton in tests/steps/travel_request.steps.js)
    And I submit the request assistance to open the reference fields popup
    # TODO: the financial reference field should be marked as mandatory (DynamicAndReferenceFieldsPage (new) in tests/steps/dynamic_fields.steps.js)
    Then the financial reference field should be marked as mandatory
    And the financial reference modal title should be "Financial Reference"
    And the reference fields popup should show the following labels:
      | Soort reis/Type of trip |
      | Type of traveller |
      | Location travel policy |
      | Location |
      | Payment Group |
      | Bank account |
    # TODO (manual): port the Testim validation-code custom assertion here (custom JS assertion was not exported)
    # TODO: the financial reference dropdown should show the placeholder "Select" (DynamicAndReferenceFieldsPage.getFinancialReferencePlaceholder (new) in tests/steps/dynamic_fields.steps.js)
    And the financial reference dropdown should show the placeholder "Select"
    And the financial reference dropdown should contain the following options:
      | uploadname10 (uploadcode10) |
      | uploadname9 (uploadcode9) |
      | uploadname8 (uploadcode8) |
    And the reference fields should have the following values:
      | field | value |
      | Soort reis/Type of trip | Select |
      | Type of traveller | Select |
      | Location travel policy | Caribbean |
      | Location | Select |
      | Traveller | ADD |
    And the following reference fields should not be editable:
      | Type of traveller |
      | Location travel policy |
      | Location |
      | Payment Group |
    When I fill in the "Bank account" reference field with "123"
    # TODO: the "Bank account" reference field should contain "123" (DynamicAndReferenceFields.verifyReferenceFieldValues in tests/steps/dynamic_fields.steps.js)
    Then the "Bank account" reference field should contain "123"
    And clicking proceed should show a mandatory field validation error
    When I select the first available option for the "Soort reis/Type of trip" reference field
    And I click proceed on the reference fields popup
    Then the financial reference modal title should be "Financial Reference"
    When I select the first available financial reference
    Then the "Sent to agent" confirmation should be displayed
    # TODO: the CC email should be delivered to the generated address and the travel request email to "shaninl@atriis.com" (EmailValidation.verifyCcAndToRecipients (new) in tests/steps/travel_request.steps.js)
    And the CC email should be delivered to the generated address and the travel request email to "shaninl@atriis.com"
    # TODO: the travel request email subject should be correct (EmailValidation.verifyEmailSubject (new) in tests/steps/travel_request.steps.js)
    And the travel request email subject should be correct
