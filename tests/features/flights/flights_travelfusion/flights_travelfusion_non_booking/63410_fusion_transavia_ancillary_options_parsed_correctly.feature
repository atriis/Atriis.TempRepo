# Test Name: 63410 Fusion - Ancillary services for Transavia are parsed correctly
# Status: Design
# Labels: Regression,Flights,Fusion,Travelfusion,Transavia,ancillary
# Owner: Noam Miller
# Created: 2025-06-08T11:49:24Z
# Updated: 2026-02-01T15:04:21Z
#
# Travelfusion files a fare's ancillary options as the AdvancedAncillaryOptions RequiredParameter
# of the ProcessDetails response sent when the quote is added to the cart:
#   <DisplayText>Please Select Advanced Ancillary Options: 0 (... - 0.00 EUR), 1 (... - 24.99 EUR)</DisplayText>
# The cart's Ancillary Options dropdown must list exactly those options, in order, with XML
# entities decoded ("&amp;" displays as "&"). Regression for 61065, where only one of three
# Transavia options was shown.

@regression @flights @fusion @provider:travelfusion @ancillary @transavia @priority:medium
Feature: 63410 Fusion - Ancillary services for Transavia are parsed correctly

  Scenario: Transavia ancillary options in the cart match the ProcessDetails response
    Given I am logged in as "fusion@gdgCorp.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "AMS" to "ATH"
    And I filter results by carrier "Transavia"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I capture the "response" payload for request type "ProcessDetails" from Storage
    Then the captured "response" payload for request type "ProcessDetails" should contain "AdvancedAncillaryOptions"
    When I click to edit the ancillary options section
    Then the ancillary options list should match the AdvancedAncillaryOptions in the captured "ProcessDetails" response
