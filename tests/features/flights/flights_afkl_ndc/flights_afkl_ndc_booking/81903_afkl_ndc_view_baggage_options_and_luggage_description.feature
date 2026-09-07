# Test Name: 73504 AFKL NDC - View baggage options and luggage description before and after hold
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,Baggage,Hold
# ADO Test Case ID: 81903
# ADO Work Item 73504

@ado:81903
@regression @flights @afkl @ndc @baggage @hold
Feature: 81903 AFKL NDC - View baggage options and luggage description
  As a corporate traveler
  I want to view the baggage options and luggage descriptions for each flight leg
  So that I can review baggage information before and after holding the trip

  Scenario: View baggage options and luggage description before and after hold
    Given I am logged in as "coordinator@afkl.ams" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "AMS" to "MAD"
    Then flight results should be available
    When I filter results by carrier "KLM"
    And I select the first flight result in new flight flow
    And I select the outbound first option from pricing options page
    And I select the inbound first option from pricing options page
    And I add to cart from pricing options page
    Then the booking status should be "Pending booking"
    When I click to edit the baggage extras section
    And I click number of baggage
    Then the luggage description should be displayed
    When I accept Terms & Conditions
    And I hold the trip
    Then the booking status should be "On hold"
    When I click to edit the baggage extras section
    And I click number of baggage
    Then the luggage description should be displayed
    Then I successfully cancel the trip
