# Test Name: 61597 Profile - 'State' dropdown field in 'Business Address' and 'Business Number' are displayed when country has states
# Description:
# Status: Active
# Labels: Profile,Regression,state,phone number,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-05T08:10:07Z
# Updated: 2025-09-14T10:51:51Z

@regression @profile @contact-information
Feature: 61597 Profile - State dropdown and business number displayed for countries with states
  As a corporate traveler
  I want to see the State dropdown and business phone number in my contact information
  So that my address and phone details are complete for countries that have states

  @priority:medium
  Scenario: State field and business number are visible in contact information
    Given I am logged in as "bruninatist@brunaadmin.com"
    When I navigate to my user profile
    And I open the contact information tab in my profile
    Then the business phone number should display country code "123" and area code "456" and number "7777"
    And the state field should be visible with value "TX"
