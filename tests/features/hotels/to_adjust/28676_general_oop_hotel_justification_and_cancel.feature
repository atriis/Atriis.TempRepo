# Test Name: 28676 MERGED hotel justification appears in cart + justification is sent to the approvers (and not the value) + justification list taken from hotel and general +travel policy by rule (using dynamic and reference fields)
# Description: 
# Status: Active
# Labels: Travel policy,justification,Email,Hotel,Approval flow,Financial Reference Code,NL government,Full Purchase,OOP,Regression,Amadeus Value hotel,Dynamic fields,Reference Fields,Daily Hotels,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-12-21T06:49:20Z
# Updated: 2025-11-10T12:47:08Z

@regression @provider:general
Feature: 28676 General - OOP hotel booking with justification and cancel
  As a corporate traveler who selects an out-of-policy hotel
  I want to provide an OOP justification and proceed with booking
  So that I can complete out-of-policy hotel bookings with proper approval workflow

  @priority:critical
  Scenario: OOP hotel requires justification in hotel, room, and cart levels
    Given I am logged in as "shani_nl" booking a new trip
    And I have added traveler by name "Shani Corp"
    When I search for a hotel in "Denver" for 1 night
    Then the out of policy indicator should be visible in results
    And the out of policy tooltip in results should be "Out of policy"
    When I select the first hotel result
    # TODO: Create step "Then the out of policy indicator should be visible in room level results" that calls DSL method verifyOOPInRoomLevel
    And I add a refundable room to my cart
    Then the out of policy indicator should be visible in cart
    # TODO: Create step "When I select OOP justification option from the dropdown list" that calls DSL method selectOOPJustificationOption
    When I fill in the OOP justification text "Business requirement"
    When I proceed to checkout
    And I complete the booking
    Then I successfully cancel the trip

