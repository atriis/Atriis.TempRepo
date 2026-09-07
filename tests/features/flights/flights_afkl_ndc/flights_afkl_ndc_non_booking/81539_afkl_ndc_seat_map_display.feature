# Test Name: 81539 AFKL NDC - Seat map extra-legroom colour and aisle display (bugs 72357, 80662)
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,Seating,Seat Map
# ADO Test Case ID: 81539

@ado:81539
@regression @flights @afkl @ndc @seating @seat-map
Feature: 81539 AFKL NDC - Seat map extra-legroom colour and aisle display
  As a corporate traveler
  I want extra-legroom seats coloured as extra legroom and the aisle drawn correctly
  So that I can tell Economy Comfort seats apart from preferred seats and read the cabin layout

  Scenario: Extra-legroom seats use the extra-legroom colour and the aisle is displayed
    Given I am logged in as "coordinator@afkl.ams" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "AMS" to a random destination from "BKK,LIM, IAD"
    Then flight results should be available
    When I filter results by carrier "KLM"
    And I select the first flight result in new flight flow
    And I select the outbound first option from pricing options page
    And I select the inbound first option from pricing options page
    And I add to cart from pricing options page
    When I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
    Then the extra legroom seats should be shown in the extra legroom color and not the preferred color
    And the seat map aisle should be displayed
