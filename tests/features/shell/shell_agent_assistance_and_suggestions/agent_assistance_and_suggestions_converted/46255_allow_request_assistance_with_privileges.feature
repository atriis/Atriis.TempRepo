# Test Name: 46255 Allow "Request Assistance" when "Can Use Request Assistance" + "Look but not book" privileges are associated
# Description:
# Status: Active
# Labels: Regression,Administration,Privileges,Request Assistance,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-21T08:35:41Z
# Updated: 2025-09-14T07:48:40Z

@regression @shell @request_assistance @flights @privileges
Feature: 46255 - Allow Request Assistance when Can Use Request Assistance and Look but not book privileges are associated

  As a traveler with Request Assistance and Look but not book privileges
  I want to send a flight travel request to an agent
  So that the requested items are created in my trip for the agent to book

  Scenario: Send a flight travel request with request-assistance privileges
    Given I am logged in as "caroline.silva@carolineprivileges.com" booking a new trip
    When I send a flight travel request from "LIS" to "TLV"
    Then the "Sent to agent" confirmation should be displayed
    When I navigate to the trip from the travel request
    Then the travel requested items should be visible in the trip
    And I successfully cancel the trip
