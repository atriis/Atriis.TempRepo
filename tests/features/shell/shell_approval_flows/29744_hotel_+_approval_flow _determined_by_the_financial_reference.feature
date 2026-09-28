# Test Name: 29744 hotel  + approval flow determined by the financial reference
# Status: Active
# Labels: Regression,Cars,Hotel,Approval flow,Full Purchase,Financial Reference Code,Email,NL government,Amadeus Value hotel,Amadeus,Pre Prod,Sanity,hybrid,Daily Hotels,66444 hotel results,Transportation,Giata,2026 plan 1
# Owner: Pini Harush
# Created: 2023-11-28T08:39:47Z
# Updated: 2026-09-28T07:47:37Z

@regression @provider:amadeus
Feature: 29744 hotel + approval flow determined by the financial reference
  As a corporate traveler requiring manager approval
  I want to submit a hotel booking for approval
  So that my booking is authorized before being finalized

  @priority:critical
  Scenario: Hotel booking triggers approval flow with multiple approvers
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added traveler by name "segev leshin"
    When I add a hotel manual quote in "London"
    And I click the proceed to checkout button
    And I select the "Financial Reference" reference field as "three approvers name" and proceed
    And I send booking for approval
    And I view the approvers in the trip overview
    Then the trip overview approvers should be:
      | Beny cohen |
      | Olga Cohen |
      | mali Cohen |
