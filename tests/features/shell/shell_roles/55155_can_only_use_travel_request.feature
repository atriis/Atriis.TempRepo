# Test Name: 55155 Can Only Use Travel Request
# Description:
# Status: Active
# Labels: Regression,Role,Privileges,Request Assistance,No Amadeus Hotel Book,Hotel,2026 plan 1
# Owner: Shani Hadar
# Created: 2025-01-27T01:03:35Z
# Updated: 2026-02-17T06:49:47Z

@regression @shell @roles @privileges @hotels @travel_request
Feature: 55155 - Can Only Use Travel Request
  As a corporate user restricted to the travel-request privilege
  I want to only be able to send travel requests to an agent instead of booking directly
  So that a product an agent adds to my trip cannot be self-checked-out by me

  Scenario: Restricted user sends a hotel travel request and cannot proceed to checkout on the agent-added product
    Given I am logged in as "Travel@Requestonly.com" booking a new trip
    And I have added myself as the traveler
    Then the search button should not be visible
    And the Travel request button should be visible
    When I search for a hotel in "LON" for 1 night without clicking search button
    And I click the request assistance icon
    And I click the send request button
    And I save the reference field popup if displayed
    Then the "Sent to agent" confirmation should be displayed
    When I navigate to the trip from the travel request
    And I log in to legacy GTP as the agent "amy@deus.com"
    And I open the current trip in legacy GTP as the agent
    And I add a refundable hotel to the trip as the agent through "Search Online"
    # --- back as the corporate: add the agent's hotel suggestion to the trip ---
    When I refresh the page
    And I open the trip overview tab
    And I add the suggested hotel quote to the trip
    Then I should see a success notification
    And the booking status should be "Pending booking"
    When I accept Terms & Conditions
    Then the proceed to checkout button should be disabled
