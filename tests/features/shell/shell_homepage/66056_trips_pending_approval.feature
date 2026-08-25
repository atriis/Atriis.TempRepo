# Test Name: 66056 Trips pending approval
# Description:
# Status: Active
# Labels: Daily Shell,Regression,2026 plan 2
# Owner: Yael
# Created: 2025-08-26T06:49:19Z
# Updated: 2025-09-21T02:53:06Z

@regression @shell @homepage
Feature: 66056 - Trips pending approval
  As a trip approver
  I want to open a trip that is awaiting my approval decision
  So that I can see the approval actions available on it

  Scenario: The approvals bar is shown on a trip awaiting my approval
    Given I am logged in as "uri@e.com"
    When I navigate to the trips page
    And I search the trips page for "3812345"
    And I expand the trips search
    Then the trips search results header should contain "Found 1 Trip"
    And the trip with id "3812345" should be displayed in the results
    When I click the first trip from the trip list
    Then the trip approval bar should show "Trip awaiting your approval" with "Decline" and "Approve" buttons
