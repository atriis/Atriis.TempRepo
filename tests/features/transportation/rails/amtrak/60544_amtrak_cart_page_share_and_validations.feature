# Test Name: 60544 Amtrak cart page share and validations
# Description: Amtrak cart page share and validations
# Status: Active
# Labels: search,Daily Transportation,Regression,Amtrak Sabre,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-04-03T12:41:41Z
# Updated: 2026-01-30T03:08:56Z
@transportation @rails @amtrak @regression
Feature: 60544 Amtrak - Cart page share and validations
  As a corporate traveler
  I want to validate the Amtrak cart page — share, extras, fare rules
  So that I can confirm the cart contains correct content and sharing works

  Scenario: Amtrak cart validations including share, extras and fare rules
    Given I am logged in as "alex@amtrakclub.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Amtrak train from "nypToWas"
    And I click more details for the first Amtrak result
    Then the available classes and fares should be displayed
    When I select the first Amtrak result from the more details drawer
    When I add an Amtrak one way to the trip
    And the booking status should be "Pending booking"
    Then the countdown clock is between 10 and 12 minutes
    When I hover the countdown clock
    Then the countdown tooltip shows the message "Your session is valid for 12 minutes from the time of selection. We recommend completing your booking within this time to avoid changes in fare or availability."
    When I click the share quote button
    And I wait to see "Subject" field in share dialog
    And I send the share and see success notification
    When I click the share itinerary button
    And I wait to see "Subject" field in share dialog
    And I send the share and see success notification
    Then the required extras notice should be visible in cart
    Then the contact information section should be required in cart
    When I expand the contact informations section in cart
    Then the phone number fields should be empty in cart
    And the phone number field should be visible in the Amtrak cart extras
    Then the Amtrak summary title should contain "Amtrak Rail to"
    Then the fare rules should be accessible in the Amtrak cart and contain "Cancellations"
    # Then the CO2 emissions should be displayed in the trip overview - According to Pedro, there is no CO2 for Amtrak
   

