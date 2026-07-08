# Test Name: 23072 Request Assistance - hotel params populated by the search + comments on hotel car and EU rail appear on requests + Financial reference does not appear on pop up if not assigned to the user group
# Description:
# Status: Active
# Labels: Request Assistance,No Amadeus Hotel Book,Regression,Hotel,Cars,NL government,Financial Reference Code,never failed,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
# Owner: pini harush
# Created: 2023-12-20T01:35:46Z
# Updated: 2025-12-10T09:23:08Z

@regression @shell @request_assistance @hotel @cars @rails @dynamic_fields
Feature: 23072 - Request Assistance hotel params populated by search with comments on hotel, car and EU rail plus financial reference hidden when not assigned to the user group

  As a corporate traveler
  I want to raise a request assistance for a hotel, a car and an EU rail journey with comments
  So that the searched hotel details and my per-item comments are sent to the agent and only the reference fields assigned to my user group are shown

  Scenario: Send a request assistance for hotel, car and rail with comments and validate the review popup and trip requests
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    When I have added traveler by name "ofira refer"
    And I search for a hotel in "LON" for 1 night without clicking search button
    And I click the request assistance icon
    Then the request assistance hotel destination should contain "London"
    When I add the comment "bla bla 2" to the request assistance hotel item
    And I add a car to the request assistance picking up in "madrid" with comment "carrr 3"
    And I add a rail journey to the request assistance from "bruss" to "paris" with comment "railll4"
    When I click the send request button
    Then the travel request review should display the field label "Type of traveller"
    And the travel request review should display the field label "Location travel policy"
    And the travel request review should display the field label "Personnel number"
    And the travel request review should display the traveler name "Ofira Refer"
    And the travel request review should display the field label "Payment Group"
    And the travel request review should display the field label "Bank account"
    And the financial reference field should not be displayed in the travel request popup
    And the number of reference and dynamic fields in the travel request popup should be 5
    When I save the reference field popup if displayed
    Then the "Sent to agent" confirmation should be displayed
    And I click go to trip button
    Then the requested hotel item should be displayed in the trip
    And the requested hotel item comment should be "bla bla 2"
    And the requested car item should be displayed in the trip
    And the requested car item comment should be "carrr 3"
    And the requested rail item should be displayed in the trip
    And the requested rail item comment should be "railll4"
