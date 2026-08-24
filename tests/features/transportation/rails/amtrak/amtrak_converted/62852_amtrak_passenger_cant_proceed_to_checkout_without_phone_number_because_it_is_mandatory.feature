# Test Name: 62852 Amtrak - Passenger can't proceed to checkout without phone number because it is mandatory
# Description:
# Status: Active
# Labels: Amtrak Sabre,Rail,Regression,phone number,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-30T03:17:39Z
# Updated: 2025-12-23T04:01:02Z
@transportation @rails @amtrak @regression
Feature: 62852 Amtrak - Mandatory phone number prevents checkout
  As a corporate traveler
  I want to be prevented from proceeding to checkout when my phone number is missing
  So that mandatory contact information is enforced before booking

  Scenario: Amtrak checkout blocked when phone number is not configured
    Given I am logged in as "alex@amtrakclub.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Amtrak train from "wasToBos"
    And I add an Amtrak one way to the trip
    And the booking status should be "Pending booking"
    Then the contact information section should be required in cart
    When I expand the contact informations section in cart
    Then the phone number fields should be empty in cart
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    Then the cart should show the in order to proceed warning
    And the proceed to checkout button should be disabled
    And the contact information should have red border because it is mandatory
