# ADO Bug #75523 – Requested items missing
# Fix: Show travel requested items when user has 'only travel request' role
# Area: Shell, Other and Analytics
# Priority: 1 (Major)
# Status: Closed (Fixed – OBT Frontend)
# Test user: pini@gov.nl (has 'only travel request' role in gov.nl corporate)

@regression @shell @priority:high
Feature: 75655 - Travel requested items visible for travel request role
  As a traveler with "only travel request" role
  I want to see the requested items (flight, hotel, car) in the trip view after sending a travel request
  So that I can confirm my request was submitted and is visible to me and to the agent

  @smoke @priority:critical
  Scenario: Travel requested flight is visible in trip for user with only travel request role
    Given I am logged in as "role@role.com"
    When I book a new trip
    And I have added myself as the traveler
    And I send a flight travel request from "LON" to "MAD"
    Then the "Sent to agent" confirmation should be displayed
    When I navigate to the trip from the travel request
    Then the travel requested items should be visible in the trip
