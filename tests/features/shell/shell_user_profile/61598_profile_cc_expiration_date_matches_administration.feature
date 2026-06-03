# Test Name: 61598 Profile - Credit card expiration date in administration corresponds to the one added in the profile
# Description:
# Status: Active
# Labels: Profile,Regression,credit card,Administration,Expiry,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-05T08:30:16Z
# Updated: 2025-08-20T11:15:28Z

@regression @profile @fop @administration
Feature: 61598 Profile - Credit card expiration date matches administration
  As a corporate traveler
  I want the credit card expiration date I set in my profile to match what shows in the administration
  So that payment details are consistent across the system

  @priority:high
  Scenario: Credit card expiry added in profile is reflected in administration
    Given I am logged in as "bruninatist@brunaadmin.com"
    When I navigate to my user profile
    And I open the form of payment tab in my profile
    And I add a credit card with name "testim test" type "visa" number "4580458045804580" expiry month "02" year "2032"
    Then the card name "testim test" should be displayed in the profile
    When I navigate to the administration page
    And I search for user "Brunina tist" in the administration
    And I open the form of payment tab in the administration
    Then the credit card "testim test" should show expiry month "2" and year "2032"
    When I delete the credit card "testim test" from the administration
