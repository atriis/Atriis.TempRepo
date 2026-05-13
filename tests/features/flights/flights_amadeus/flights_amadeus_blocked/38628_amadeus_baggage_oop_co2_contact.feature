# Test Name: 38628 MERGED Amadeus oop for baggage amount with no baggage included + can see CO2 emissions data + CO2 values appear even if in the administration they are inherited from the agency + contact info appears for a corporate user
# Description:
# Status: Active
# Labels: Flights,Amadeus,Travel policy,NL government,baggage,OOP,Full Purchase,Regression,contact info,CO2,No Amadeus Hotel Book,progress page,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-20T11:18:46Z
# Updated: 2025-11-11T08:36:15Z

@regression @flights @amadeus @baggage @oop @co2 @contact-info @travel-policy
Feature: 38628 Amadeus - Baggage OOP + CO2 emissions + contact info
  As a corporate traveler
  I want to verify OOP for baggage, CO2 data, and contact info for corporate users
  So that all travel policy and environmental data is displayed correctly

  Scenario: Baggage OOP triggered, CO2 displayed, contact info visible for corporate user
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added traveler by name "lary bagto"
    # TODO: Search round trip with dates 2 months ahead
    When I search for a round trip flight from "TLV" to "BUD"
    And I click proceed on the reference fields popup
    And flight results should be available
    # TODO: Validate CO2 emissions displayed in results
    # Testim: validate_CO2() — checks CO2 icon and values in flight results
    # Need new step: Then CO2 emissions data should be visible in results
    And I filter results by carrier "EL AL"
    And I add the first flight to cart
    Then the out of policy indicator should not be visible in cart
    # TODO: Validate CO2 data displayed in cart
    # Testim: validate_CO2_in_cart() — checks CO2 values in cart view
    # Need new step: Then CO2 emissions data should be visible in cart
    # TODO: Add 1 bag and verify still in-policy
    # Testim: add_1_bag_and_validate_there_is_no_oop()
    # TODO: Add second bag and verify OOP triggered
    # Testim: add_second_bagage_and_validate_oop()
    # TODO: Validate justification required
    # Testim: validate_justification()
    And I proceed to checkout
    # TODO: Verify "Contact details" section visible for corporate user
    # Testim: waitForText(page, ".contact-details-container ...", 'Contact details')
    # TODO: Validate contact details fields
    # Testim: validate_contact_details()
    # TODO: Book and finalize with contact details
    And I complete the booking
    # TODO: Verify "Out of policy" badge on trip overview
    # Testim: waitForText(page, ".out-of-policy-badge", 'Out of policy')
    Then I successfully cancel the trip
