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
    # TODO: implement step - add a second profiled traveller by name
    And I have added the traveller "Gadi cohen"
    When I search for a one night hotel in "LON"
    When I fill in NL reference fields education and courses
    When I add the first hotel room to cart
    # TODO: implement step - fill the free-text justification in the cart if the item is out of policy
    When I fill the free text justification in the cart if needed
    When I proceed to checkout
    When I select the first available financial reference
    # TODO: implement step - verify the "Travellers Reference Questions" section is displayed
    Then the "Travellers Reference Questions" reference section is displayed
    # TODO: implement step - verify the dynamic reference fields are displayed for the first corporate user
    And the reference fields for traveller "Gadi Cohen" show "Payment Group" and "Bank account"
    # TODO: implement step - verify the dynamic reference fields are displayed for the second corporate user
    And the reference fields for traveller "Shani Cohen" show "Payment Group" and "Bank account"
    # TODO: implement step - verify the dynamic reference field values
    Then the reference field values are:
      | ACC |
      | 456 |
      | ADD |
    # TODO: implement step - was a Testim html-attr-validation; verify the reference fields are editable and accept new values
    When I edit the reference field values to "111" and "222"
    # TODO: implement step - verify the edited reference field values are updated
    Then the reference field values are updated to "111" and "222"
    Then I successfully cancel the trip
