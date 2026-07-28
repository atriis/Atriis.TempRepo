# Test Name: 33776 Copy Trip - Agent Assistance, Only selected products are copied
# Description: flight, hotel and car in the cart (added by the agent). one of them was added to the trip by the corporate. the copy trip will copy only the added one
# Status: Active
# Labels: Regression,Request Assistance,Cars,Flights,No Amadeus Hotel Book,Hotel,Copy Trip,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2025-07-13T08:42:50Z
# Updated: 2026-02-16T01:56:23Z

@regression @shell @copy-trip @request-assistance @flights @hotel @cars
Feature: 33776 - Copy trip only copies products added to the trip (agent assistance)
  As a corporate traveler who requested agent assistance
  I want copy trip to copy only the products that were actually added to the trip
  So that agent-suggested items still sitting in the cart are not copied

  Scenario: Only the product added to the trip is copied, suggested items are not
    Given I am logged in as "asi@stance.com" booking a new trip
    And I have added myself as the traveler
    When I click the request assistance icon
    And I fill in the request assistance flight from "lhr" to "MAD"
    And I add a car to the request assistance picking up in "JFK"
    And I add a hotel to the request assistance in "lon"
    When I click the send request button
    Then the "Sent to agent" confirmation should be displayed
    And the request assistance success description should be "Your request was successfully created"
    When I navigate to the trip from the travel request
    # --- agent adds flight, car and hotel to the trip in legacy GTP ---
    And I log in to legacy GTP as the agent "amy@deus.com"
    And I open the current trip in legacy GTP as the agent
    And I add a flight to the trip as the agent from "DOH"
    And I add a car to the trip as the agent
    And I add a hotel to the trip as the agent
    # --- back as the corporate: add only the car quote to the trip, then copy ---
    When I refresh the page
    And I open the trip overview tab
    And I add the suggested car quote to the trip
    Then I should see a success notification
    # --- copy the trip ---
    When I open the copy trip dialog
    Then the copy trip dialog item "Car rental at" should show status "Pending Booking"
    And only the "Car rental at" quote should be listed in the copy trip dialog
    When I confirm the copy trip
    Then the booking status should be "Pending booking"
    And the copied trip should contain a car quote
    And the copied trip suggested items section should be displayed
    # Exactly one: of the agent's three suggestions (flight, car, hotel) only the car was added to
    # the trip, so only the car was eligible for copy — a leak of the other two would give 3.
    And the copied trip suggested items should contain 1 quote
