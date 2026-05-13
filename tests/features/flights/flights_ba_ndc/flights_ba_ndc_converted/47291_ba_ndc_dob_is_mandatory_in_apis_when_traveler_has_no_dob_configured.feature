# Test Name: 47291 BA NDC - DOB is mandatory in APIS when traveler does not have DOB configured
# Description:
# Status: Active
# Labels: BA NDC Regression,APIS,Flights,Cart,DOB,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-04-17T09:58:07Z
# Updated: 2025-09-14T09:18:51Z

@regression @flights @ndc @ba @apis @dob
Feature: 47291 BA NDC - DOB is mandatory in APIS when traveler has no DOB configured

  As a corporate traveler
  I want to book a BA NDC flight to the US as a traveler without a DOB configured
  So that I can verify DOB is mandatory in the APIS section

  Scenario: DOB is required in APIS for traveler without configured DOB
    Given I am logged in as "chris@ndcba.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "NYC"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    # TODO: implement step — 'the passenger info section should be marked as required'
    #   Assert the APIS extras section has a required indicator (reuse step from 44471)
    Then the passenger info section should be marked as required
    # TODO: implement step — 'I click to open passenger info to edit APIS'
    #   Click the edit/expand button on the APIS extras section (reuse step from 44471)
    When I click to open passenger info to edit APIS
    # TODO: implement step — 'the date of birth field should be required in the APIS section'
    #   Assert the DOB field is visible and marked as required (e.g. red asterisk) in the APIS form
    Then the date of birth field should be required in the APIS section
    # TODO: implement step — 'I fill in the APIS date of birth using the date picker'
    #   Open the date-of-birth date picker in the APIS form and select a valid date
    When I fill in the APIS date of birth using the date picker
    # TODO: implement step — 'I try to save the APIS form' (reuse step from 44471)
    And I try to save the APIS form
    # TODO: css-prop-validation — verify the save button is disabled or field is highlighted after partial fill
