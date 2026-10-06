# Test Name: 86185 - Edit Dynamic behavior for Booker without 'Can Edit Non Editable Dynamic Profile Fields'
# Description:
# Status: Design
# Labels: Regression,Dynamic fields,Profile
# Owner:
# Created:
# Updated:

# ADO Test Case ID: 86185
@ado:86185
@shell @reference_fields @dynamic_fields @regression @checkout
Feature: 86185 Shell - Dynamic profile field editability for a booker without "Can Edit Non Editable Dynamic Profile Fields"

  As a booker without the "Can Edit Non Editable Dynamic Profile Fields" privilege
  I want each dynamic profile field to be editable only where its "Editable on" setting allows
  So that profile-only fields are locked at checkout, checkout-only fields are locked in my profile,
  and "Nowhere" fields can never be changed

  Scenario: Dynamic profile fields respect their "Editable on" setting in My Profile and at checkout
    Given I am logged in as "NONEdible@Dynamic.com"
    When I navigate to my user profile
    Then the following reference fields should be editable:
      | Field is editable on My profile |
      | Field is editable on Both       |
    And the following reference fields should not be editable:
      | Field is editable on Checkout              |
      | Field is editable on Nowhere               |
      | Field is editable on Nowhere Mandatory yes |
    When I close tab 2
    And I book a new trip
    And I have added myself as the traveler
    And I navigate to the manual quote search page
    And I add a car manual quote with pick up in "Portland" and drop off in "San Francisco"
    And I click the proceed to checkout button
    And I wait for booking details in checkout
    Then the following reference fields should be editable:
      | Field is editable on Checkout |
      | Field is editable on Both     |
    And the following reference fields should not be editable:
      | Field is editable on My profile            |
      | Field is editable on Nowhere               |
      | Field is editable on Nowhere Mandatory yes |
    When I navigate to cart from checkout
    Then I successfully cancel the trip
