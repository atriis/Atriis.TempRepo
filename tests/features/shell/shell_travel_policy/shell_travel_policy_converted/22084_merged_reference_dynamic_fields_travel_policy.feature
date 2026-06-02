# Test Name: 22084 MERGED reference fields and dynamic fields and travel policy and financial reference codes are taken from the primary traveler - 1 guest as primary and 1 corp user
# Description:
# Status: Active
# Labels: Financial Reference Code,NL government,Hotel,Regression,No Amadeus Hotel Book,guest,Dynamic fields,Reference Fields,Travel policy,Pre Prod,Daily Shell,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-01T09:38:34Z
# Updated: 2026-02-04T12:30:56Z

@regression @travel_policy @dynamic_fields @reference_fields @financial_reference @hotel @daily_shell @shell
Feature: 22084 Travel Policy - Reference fields, dynamic fields and financial reference from primary traveler

  As a travel arranger
  I want the system to take reference fields, dynamic fields, and travel policy from the primary traveler
  So that the correct corporate policies and fields are applied based on the primary guest

  Scenario: Guest as primary traveler - reference fields, dynamic fields, travel policy and financial reference codes
    Given I am logged in as "Shani@Testimcorpnl.com" booking a new trip
    # TODO: Add guest traveler (Israel Israeli) with user group Adis Ababa
    # TODO: Add second traveler by name "shani cohen"
    When I search for a hotel in "london" for 1 night(s)
    # TODO: Validate reference and dynamic fields on search page:
    #   - Verify "Type of Trip" label is visible
    #   - Verify "Type of traveller" label is visible
    #   - Verify "Location travel policy" label is visible
    #   - Verify "Location" label is visible
    #   - Verify "Personnel number" label is visible
    #   - Verify all fields show "Select" as default
    #   - Verify mandatory validation errors when clicking proceed without filling
    #   - Fill in reference fields: "Annual leave", "Election observer", "Netherlands", "ABU DHABI", "123"
    #   - Click proceed to move to results
    # TODO: Validate travel policy:
    #   - Click on hotel and hover OOP info icon
    #   - Verify tooltip shows "Hotel cost per night is greater than or equals 30 EUR"
    #   - Navigate back to results
    When I wait to see view rates text in results page
    And I select the first hotel result
    And I add the first available room to my cart
    # TODO: Validate financial reference in checkout:
    #   - Open financial reference dropdown
    #   - Verify options: "uploadname7 (uploadcode7)", "uploadname5 (uploadcode5)", "uploadname6 (uploadcode6)"
    Then I successfully cancel the quote
