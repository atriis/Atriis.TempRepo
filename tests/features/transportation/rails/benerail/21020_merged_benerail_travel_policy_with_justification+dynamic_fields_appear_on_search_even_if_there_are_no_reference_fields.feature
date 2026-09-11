# Test Name: 21020 MERGED benerail travel policy with justification + dynamic fields appear on search even if there are no reference fields
# Description: oop justification field appears on the cart, drop down options are taken from the administration
# Status: Active
# Labels: NL government,OOP,performance,No Amadeus Hotel Book,Regression,Travel policy,Dynamic fields,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-11-29T07:52:01Z
# Updated: 2026-02-03T09:38:42Z
@transportation @rails @benerail @regression @travel_policy
Feature: 21020 Benerail - Travel policy with OOP justification and dynamic fields on search
  As a corporate traveler under NL government policy
  I want to see OOP justification and dynamic fields when booking Benerail
  So that policy compliance is enforced and recorded

  Scenario: OOP justification dropdown appears with dynamic fields even without reference fields
    Given I am logged in as "beneditarainha@benemoove.com" booking a new trip
    And I have added traveler by name "brenda benedita"
    When I search for a round trip Benerail train from "beabtToNlasc"
    Then the number of reference and dynamic fields in the travel request popup should be 3
    And the reference fields should have the following values:
      | field | value |
      | Type of Traveller | Select |
      | Location Travel Policy | Hardship post |
      | Personnel Number |  |
    # Only Personnel Number is configured editableOn=NoWhere and so stays locked here. AB#83166
    # (Atriis.App 25c45352 + 96857090, 2026-08-19/20) replaced the blanket "corporate primary user
    # cannot edit at Search stage" rule with `(question.editable && editableOn !== NoWhere) ||
    # editableOn === Both`, which deliberately made Type of Traveller and Location Travel Policy
    # editable at this stage. Asserting them as locked tested the old blanket rule, not any config.
    And the following reference fields should not be editable:
      | Personnel Number       |
    And I click proceed button if visible
    When I add a Benerail round trip to the trip
    And the booking status should be "Pending booking"
    Then the out of policy indicator should be visible in cart
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    Then the cart should show the in order to proceed warning
    And the proceed to checkout button should be disabled
    When I open the OOP justification dropdown and verify there are 4 options
    Then the OOP justification dropdown should contain the following options:
      | rail a       |
      | rail b       |
      | general a    |
      | general b    |
     When I select OOP justification option "rail a" from the open dropdown
     And I accept Terms & Conditions
     And I click the proceed to checkout button once enabled
     Then I wait for booking details in checkout
   
