# Test Name: 23075 MERGED flight search params populated in travel request form + dynamic and reference and financial fields on the pop up are taken from the primary user (different from the booker)
# Description: parameters in travel request form should be pre-populated according to the data entered in the flight search page + the reference and dynamic anf financial fields on travel request pop up should be taken from the primary traveler (in this case user with user group that s different from the booker)
# Status: Active
# Labels: Request Assistance,Flights,No Amadeus Hotel Book,Regression,Reference Fields,NL government,Financial Reference Code,Dynamic fields,Search Flight,never failed,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-12-20T10:14:46Z
# Updated: 2026-02-16T01:39:50Z

@regression @shell @request_assistance @flights @dynamic_fields
Feature: 23075 - Flight search parameters populate the travel request form and reference, dynamic and financial fields are taken from the primary traveler

  As a booker sending a flight request on behalf of a primary traveler
  I want the flight search parameters carried into the travel request form and the reference, dynamic and financial fields taken from the primary traveler
  So that the agent receives an accurate request that reflects the primary traveler's policy

  Scenario: Flight parameters populate the travel request form with the primary traveler's reference fields
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added myself as the traveler
    And I have added "Gadi cohen" as primary traveler
    When I click on the flight tab
    # TODO: I fill in a round trip "Premium Economy" class flight from "lon" to "tlv" without clicking search button (FlightSearch.searchFlightRoundTripWithCabinClassWithoutSearch in tests/steps/flight_search.steps.js)
    And I fill in a round trip "Premium Economy" class flight from "lon" to "tlv" without clicking search button
    And I click the request assistance icon
    # TODO: the flight search origin field should show "London" (Search.verifyFromFieldValue in tests/steps/search.steps.js)
    Then the flight search origin field should show "London"
    # TODO: the flight search destination field should show "Tel Aviv" (Search.verifyToFieldValue in tests/steps/search.steps.js)
    And the flight search destination field should show "Tel Aviv"
    # TODO: the flight search departure date field should show {string} (Search.verifyDepartDateValue in tests/steps/search.steps.js)
    And the flight search departure date field should show {string}
    # TODO: the flight search return date field should show {string} (Search.verifyReturnDateValue in tests/steps/search.steps.js)
    And the flight search return date field should show {string}
    # TODO: the flight search cabin class should show "Premium Economy" (Search.verifyCabinClassValue in tests/steps/search.steps.js)
    And the flight search cabin class should show "Premium Economy"
    And the traveler name "Shani Cohen" should be visible in the travelers list
    And the traveler name "Gadi Cohen" should be visible in the travelers list
    # TODO: MANUAL - convert Testim validation-code-step (custom JS assertion) by hand (new in tests/steps/travel_request.steps.js)
    # TODO: I click the send request button (TravelRequest.clickSendRequestButton in tests/steps/travel_request.steps.js)
    When I click the send request button
    # TODO: the financial reference section should show a mandatory marker (DynamicAndReferenceFields.verifyFinancialReferenceMandatoryMarker in tests/steps/dynamic_fields.steps.js)
    Then the financial reference section should show a mandatory marker
    # TODO: the financial reference section title should be "Financial Reference" (DynamicAndReferenceFields.verifyFinancialReferenceModalTitle in tests/steps/dynamic_fields.steps.js)
    And the financial reference section title should be "Financial Reference"
    And the reference fields popup should show the following labels:
      | Type of Trip |
      | Type of traveller |
      | Location travel policy |
      | Personnel number |
      | Payment Group |
      | Bank account |
    # TODO: the reference fields section for traveler "Gadi Cohen" should be visible (DynamicAndReferenceFields.verifyTravelerReferenceSectionVisible in tests/steps/dynamic_fields.steps.js)
    And the reference fields section for traveler "Gadi Cohen" should be visible
    # TODO: the reference fields section for traveler "Shani Cohen" should be visible (DynamicAndReferenceFields.verifyTravelerReferenceSectionVisible in tests/steps/dynamic_fields.steps.js)
    And the reference fields section for traveler "Shani Cohen" should be visible
    # TODO: MANUAL - convert Testim validation-code-step (custom JS assertion) by hand (new in tests/steps/dynamic_fields.steps.js)
    # TODO: the financial reference dropdown should show placeholder "Select" (DynamicAndReferenceFields.verifyFinancialReferencePlaceholder in tests/steps/dynamic_fields.steps.js)
    And the financial reference dropdown should show placeholder "Select"
    # TODO: I open the reference field dropdown in collapse section "Financial Reference" (DynamicAndReferenceFields.openReferenceFieldDropdown in tests/steps/dynamic_fields.steps.js)
    When I open the reference field dropdown in collapse section "Financial Reference"
    Then the financial reference dropdown should contain the following options:
      | uploadname3 (uploadcode3) |
      | uploadname4 (uploadcode4) |
    # TODO: the reference field dropdown should show placeholder "Select" (DynamicAndReferenceFields.verifyReferenceFieldPlaceholder in tests/steps/dynamic_fields.steps.js)
    And the reference field dropdown should show placeholder "Select"
    And the reference fields should have the following values:
      | field | value |
      | Type of traveller | External employee |
      | Location travel policy | Netherlands |
      | Type of Trip | ACC |
      | Personnel number | 456 |
      | Cost center | ADD |
    And the following reference fields should not be editable:
      | Type of Trip |
      | Type of traveller |
      | Location travel policy |
      | Personnel number |
      | Cost center |
    When I fill in the "Personnel number" reference field with "123"
    And I fill in the "Bank account" reference field with "565"
    # TODO: the reference field "Personnel number" should show "123" (DynamicAndReferenceFields.verifyReferenceFieldValues in tests/steps/dynamic_fields.steps.js)
    Then the reference field "Personnel number" should show "123"
    # TODO: the reference field "Bank account" should show "565" (DynamicAndReferenceFields.verifyReferenceFieldValues in tests/steps/dynamic_fields.steps.js)
    And the reference field "Bank account" should show "565"
    When I click proceed on the reference fields popup
    # TODO: the mandatory field validation error should be displayed (DynamicAndReferenceFields.clickProceedAndVerifyMandatoryError in tests/steps/dynamic_fields.steps.js)
    Then the mandatory field validation error should be displayed
    # TODO: I open the reference field dropdown in collapse section "Payment Group" (DynamicAndReferenceFields.openReferenceFieldDropdown in tests/steps/dynamic_fields.steps.js)
    When I open the reference field dropdown in collapse section "Payment Group"
    And I select the "Payment Group" reference field as "uploadname3 (uploadcode3)"
    And I click proceed on the reference fields popup
    # TODO: the financial reference section title should be "Financial Reference" (DynamicAndReferenceFields.verifyFinancialReferenceModalTitle in tests/steps/dynamic_fields.steps.js)
    Then the financial reference section title should be "Financial Reference"
    # TODO: I open the reference field dropdown in collapse section "Financial Reference" (DynamicAndReferenceFields.openReferenceFieldDropdown in tests/steps/dynamic_fields.steps.js)
    When I open the reference field dropdown in collapse section "Financial Reference"
    And I select the "Financial Reference" reference field as "uploadname4 (uploadcode4)"
    And I click proceed on the reference fields popup
    Then the "Sent to agent" confirmation should be displayed
