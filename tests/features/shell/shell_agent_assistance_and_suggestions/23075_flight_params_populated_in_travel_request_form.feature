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
    When I fill in a round trip "Premium Economy" class flight from "lon" to "tlv" without clicking search button
    And I extract departure and return dates
    And I click the request assistance icon
    Then the travel request flight origin should contain "London"
    And the travel request flight destination should contain "Tel Aviv"
    And the travel request flight depart date should show the extracted departure date
    And the travel request flight return date should show the extracted return date
    And the travel request flight cabin class should show "Premium Economy"
    And the traveler name "Shani Cohen" should be visible in the travelers list
    And the traveler name "Gadi Cohen" should be visible in the travelers list
    And the number of travelers in the travel request should be 2
    When I click the send request button
    Then the financial reference section should show a mandatory marker
    And the financial reference modal title should be "Financial Reference"
    And the reference fields popup should show the following labels:
      | Type of Trip |
      | Type of traveller |
      | Location travel policy |
      | Personnel number |
      | Payment Group |
      | Bank account |
    And the travel request popup should show a reference section for traveler "Gadi Cohen"
    And the travel request popup should show a reference section for traveler "Shani Cohen"
    And the number of reference and dynamic fields in the travel request popup should be 9
    And the reference fields should have the following values:
      | field | value |
      | Financial Reference | Select |
    When I open the financial reference dropdown in the travel request popup
    Then the financial reference dropdown should contain the following options:
      | uploadname3 (uploadcode3) |
      | uploadname4 (uploadcode4) |
    And the reference fields should have the following values:
      | field | value |
      | Type of Trip | Select |
      | Type of traveller | External employee |
      | Location travel policy | Netherlands |
      | Payment Group | ADD |
    And the following reference fields should not be editable:
      | Type of traveller |
      | Payment Group |
      | Personnel number |
    When I fill in the "Bank account" reference field with "565"
    Then the reference fields should have the following values:
      | field | value |
      | Bank account | 565 |
    Then clicking proceed should show a mandatory field validation error
    When I select the first available option for the "Type of Trip" reference field
    And I click proceed on the reference fields popup
    Then the financial reference modal title should be "Financial Reference"
    When I select the "Financial Reference" reference field as "uploadname4 (uploadcode4)"
    And I save the reference field popup if displayed
    Then the "Sent to agent" confirmation should be displayed
