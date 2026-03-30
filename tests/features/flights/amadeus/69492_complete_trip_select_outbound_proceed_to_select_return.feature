@daily_flights
Feature: 69492 Complete Trip – Select Outbound, Proceed to Select Return
  As a corporate traveler
  I want to search for a round trip flight and complete trip search
  So that I can review the redirect to return segment after selecting outbound 
  
  @priority:critical
  Scenario: Search round trip complete trip and proceed to select return
    Given I am logged in as "robsoncruz" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MAD" to "FRA"
    And I click on "Pricing Options" for the first result
    Then I should see the heading "Flight To Frankfurt"
    And I select the first option from pricing options
    Then the green circle icon at index 0 "first flight" should be displayed in pricing options
    Then I should see the heading "Flight To Madrid"
    And I select the first option from pricing options
    Then the green circle icon at index 1 "second flight" should be displayed in pricing options