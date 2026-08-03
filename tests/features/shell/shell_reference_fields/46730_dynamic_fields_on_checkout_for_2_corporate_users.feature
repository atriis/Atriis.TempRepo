# Test Name: 46730 dynamic fields on checkout for 2 corporate users
# Description:
# Status: Active
# Labels: Regression,Dynamic fields,Hotel,No Amadeus Hotel Book,Daily Shell,Pre Prod,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-05-30T11:47:42Z
# Updated: 2026-02-09T07:18:43Z

@shell @reference_fields @dynamic_fields @regression @checkout
Feature: 46730 - Dynamic fields at checkout for two corporate users

  As a booker booking for two corporate travellers
  I want each traveller's dynamic reference fields shown, valued and editable at checkout
  So that the correct financial reference information is captured per traveller

  Scenario: Dynamic reference fields are shown, valued and editable for two corporate users at checkout
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Gadi cohen"
    When I initiate a hotel search in "London, UK" for 1 night
    And I select the "Soort reis/Type of trip" reference field as "Medical leave" and proceed
    And I select the first hotel result
    And I add a refundable room to my cart
    And I fill in the OOP justification text "abc"
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    When I select the first available financial reference
    And I wait for booking details in checkout
    And the dynamic profile field "Payment Group" is displayed for "2" travellers
    And the dynamic profile field "Bank Account" is displayed for "2" travellers
    Then the "Travellers Reference Questions" reference section is displayed
    And the reference fields for traveller "Gadi Cohen" show "Payment Group" and "Bank account"
    And the reference fields for traveller "Shani Cohen" show "Payment Group" and "Bank account"
    Then the reference field values are:
      | ACC |
      | 456 |
      | ADD |
      | 11  |
    When I edit the reference field values to "111" and "222"
    Then the reference field values are updated to "111" and "222"
