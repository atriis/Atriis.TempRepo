# Test Name: 62852 Amtrak - Passenger can't proceed to checkout without phone number because it is mandatory
# Description:
# Status: Active
# Labels: Amtrak Sabre,Rail,Regression,phone number,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-30T03:17:39Z
# Updated: 2025-12-23T04:01:02Z
@wip @transportation @rails @amtrak @regression
Feature: 62852 Amtrak - Mandatory phone number prevents checkout
  As a corporate traveler
  I want to be prevented from proceeding to checkout when my phone number is missing
  So that mandatory contact information is enforced before booking

  Scenario: Amtrak checkout blocked when phone number is not configured
    Given I am logged in as "bar" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Amtrak train from "wasToBos"
    And I click proceed on the reference fields popup
    When I add the first result to trip
    # TODO: create step "Then the contact information section should be required in cart" in amtrak.steps.js
    # covers: waitForText(".el-tabs .card-title", '* Contact Information') - asterisk indicates mandatory
    Then the contact information section should be required in cart
    # TODO: create step "When I expand the Amtrak extras section in cart" in amtrak.steps.js
    # covers: page.click(".ticket-layout-container .is-clickable")
    When I expand the Amtrak extras section in cart
    # TODO: create step "Then the phone number fields should be empty in cart" in amtrak.steps.js
    # covers: waitForText("#el-id-4078-323", ''), waitForText("#el-id-4078-324", ''), waitForText("#el-id-4078-325", '')
    Then the phone number fields should be empty in cart
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    # TODO: create step "Then the proceed to checkout button should be disabled" in amtrak.steps.js
    # covers: waitForText(".disabled span", 'Proceed to Checkout')
    Then the proceed to checkout button should be disabled
    # TODO: create step "And the mandatory information validation error should be displayed" in amtrak.steps.js
    # covers: waitForText(".form-payment-err", '*In order to proceed, please add all required information')
    And the mandatory information validation error should be displayed
