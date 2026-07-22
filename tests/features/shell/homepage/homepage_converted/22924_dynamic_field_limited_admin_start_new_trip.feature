# Test Name: 22924 MERGED cant proceed if there is a mandatory and empty and non editable dynamic field on search + access limited admin + user with 2 products or less see "start new trip" button on homepage
# Description:
# Status: Active
# Labels: NL government,Dynamic fields,No Amadeus Hotel Book,Homepage,Products,Regression,Administration,Role,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-01T12:50:30Z
# Updated: 2024-10-28T07:08:04Z

@regression @shell @homepage @merge @dynamic_fields @administration
Feature: 22924 - Mandatory non-editable dynamic field, limited admin, and start new trip button
  As a corporate traveler on an NL government account
  I want mandatory blocked fields enforced, limited admin access, and the right homepage entry point
  So that bookings respect policy and my role sees the correct products and tools

  Scenario: A user with two products or less sees the "Start New Trip" button on the homepage
    Given I am logged in as "dina@Testimcorpnl.com"
    # TODO: implement 'the start new trip button should be visible on the homepage' — assert the ".imt-btn" Start New Trip button is visible for low-product users
    Then the start new trip button should be visible on the homepage

  Scenario: Cannot proceed when a mandatory, empty and non-editable dynamic field is on search
    Given I am logged in as "dina@Testimcorpnl.com"
    # TODO: implement 'I click the start new trip button' — click the ".imt-btn" Start New Trip button on the homepage
    When I click the start new trip button
    Then the search title should contain "Book and stay at your hotel"
    Given I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    Then the message "This field is mandatory and blocked from editing. Please contact your administrator for assistance" is displayed in the pop up reference field
    # TODO: implement 'I select the mandatory reference field option in the popup' — open the collapse section and select the option in the reference fields popup
    When I select the mandatory reference field option in the popup
    And I click proceed on the reference fields popup
    Then the message "This field is mandatory and blocked from editing. Please contact your administrator for assistance" is displayed in the pop up reference field

  Scenario: A limited admin user can access only the permitted administration sections
    Given I am logged in as "dina@Testimcorpnl.com"
    When I navigate to the administration page
    # TODO: implement 'the admin section {string} should be visible' — assert the named administration section is visible
    Then the admin section "Users" should be visible
    And the admin section "Point of Interest" should be visible
    And the admin section "Preferred Hotels" should be visible
    And the admin section "Quick Links" should be visible
    # TODO: implement 'the limited admin permissions should be validated manually' — Testim 'validation-code-step' (limit_admin) must be converted manually
    And the limited admin permissions should be validated manually
