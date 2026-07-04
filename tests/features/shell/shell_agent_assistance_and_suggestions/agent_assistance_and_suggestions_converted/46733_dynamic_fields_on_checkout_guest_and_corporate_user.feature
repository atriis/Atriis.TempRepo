# Test Name: 46733 dynamic fields on checkout for guest and another corporate user
# Description: reference & dynamic and financial fields on travel request pop up determined by primary traveler. in this test the primary is a guest - fields + content + editable + mandatory
# Status: Active
# Labels: Regression,Hotel,No Amadeus Hotel Book,guest,Dynamic fields,Daily Shell,Pre Prod,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-06-02T05:57:05Z
# Updated: 2026-02-09T07:30:04Z

@regression @shell @dynamic_fields @hotel
Feature: 46733 - Dynamic and financial reference fields on checkout determined by the primary guest traveler
  As a corporate travel booker
  I want the checkout reference and financial fields to be determined by the primary traveler
  So that a guest primary traveler drives the correct dynamic fields for the whole trip

  Scenario: Reference fields on checkout are driven by the primary guest traveler
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added a guest traveler "Israel" "Israeli" with user group "israel"
    And I have added traveler by name "gadi cohen"
    When I search for a hotel in "denver" for 1 night
    # TODO: I select option 3 for the "Type of Trip" reference field (DynamicAndReferenceFields.selectReferenceFieldOptionByIndex in tests/steps/dynamic_fields.steps.js)
    And I select option 3 for the "Type of Trip" reference field
    And I select the first available option for the "Location travel policy" reference field
    And I click proceed on the reference fields popup
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    And the hotel should appear as refundable in cart
    And the hotel should appear as refundable in cart
    # TODO: I fill in the out of policy justification free text if the item is out of policy (Cart.fillOutOfPolicyJustificationIfNeeded in tests/steps/cart.steps.js)
    When I fill in the out of policy justification free text if the item is out of policy
    And I accept Terms & Conditions
    And I proceed to checkout
    And I select the first available financial reference
    # TODO: the checkout reference fields section should be displayed for traveler "Israel Israeli" (DynamicAndReferenceFields.verifyTravelerReferenceSectionVisible in tests/steps/dynamic_fields.steps.js)
    Then the checkout reference fields section should be displayed for traveler "Israel Israeli"
    And the following checkout reference fields should be visible:
      | Payment Group |
      | Bank account |
    # TODO: the checkout reference fields section should be displayed for traveler "Gadi Cohen" (DynamicAndReferenceFields.verifyTravelerReferenceSectionVisible in tests/steps/dynamic_fields.steps.js)
    And the checkout reference fields section should be displayed for traveler "Gadi Cohen"
    And the following checkout reference fields should be visible:
      | Payment Group |
      | Bank account |
    # TODO: the checkout reference fields should match the expected configuration for each traveler (DynamicAndReferenceFields.verifyPerTravelerReferenceFieldConfig in tests/steps/dynamic_fields.steps.js)
    And the checkout reference fields should match the expected configuration for each traveler
    And the reference fields should have the following values:
      | field | value |
      | Payment Group | ACC |
      | Bank account | 456 |
    # TODO: the "Payment Group" reference field should be unselected for traveler "Gadi Cohen" (DynamicAndReferenceFields.verifyReferenceFieldUnselected in tests/steps/dynamic_fields.steps.js)
    And the "Payment Group" reference field should be unselected for traveler "Gadi Cohen"
    # TODO: the {string} reference field editable attribute should be validated (DynamicAndReferenceFields.verifyReferenceFieldEditableAttribute in tests/steps/dynamic_fields.steps.js)
    And the {string} reference field editable attribute should be validated
    When I fill in the "Bank account" reference field with "111"
    # TODO: I open the "Payment Group" reference field dropdown for traveler "Gadi Cohen" (DynamicAndReferenceFields.openReferenceFieldDropdownForTraveler in tests/steps/dynamic_fields.steps.js)
    And I open the "Payment Group" reference field dropdown for traveler "Gadi Cohen"
    # TODO: I select "CHS" in the "Payment Group" reference field for traveler "Gadi Cohen" (DynamicAndReferenceFields.selectReferenceFieldOptionForTraveler in tests/steps/dynamic_fields.steps.js)
    And I select "CHS" in the "Payment Group" reference field for traveler "Gadi Cohen"
    Then the reference fields should have the following values:
      | field | value |
      | Payment Group | ACC |
      | Bank account | 111 |
    # TODO: the "Payment Group" reference field should show "CHS" for traveler "Gadi Cohen" (DynamicAndReferenceFields.verifyReferenceFieldValueForTraveler in tests/steps/dynamic_fields.steps.js)
    And the "Payment Group" reference field should show "CHS" for traveler "Gadi Cohen"
    # TODO: I fill in the "Bank account" reference field with "222" for traveler "Gadi Cohen" (DynamicAndReferenceFields.fillReferenceFieldForTraveler in tests/steps/dynamic_fields.steps.js)
    When I fill in the "Bank account" reference field with "222" for traveler "Gadi Cohen"
    # TODO: the "Bank account" reference field should show "222" for traveler "Gadi Cohen" (DynamicAndReferenceFields.verifyReferenceFieldValueForTraveler in tests/steps/dynamic_fields.steps.js)
    Then the "Bank account" reference field should show "222" for traveler "Gadi Cohen"
    When I navigate to the trip cart
    Then the booking status should be "Pending booking"
    When I successfully cancel the trip
