# Test Name: 64877 AFKL - Flights are succesfully added to cart when city has an airport and a train station
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,Pricing Options,Nearby Airports
# Owner: Bruna Santos

# ADO Test Case ID: 64877
@ado:64877 @regression @flights @afkl @ndc @pricing-options @provider:afkl
Feature: 64877 AFKL - Flights are added to cart when the city has an airport and a train station
  As a corporate traveler
  I want to add an AFKL round trip from a city that has both an airport and a train station
  So that mixed rail/bus and flight itineraries can be added to the trip

  Scenario: Round trip MST-PVG with nearby airports is added to cart via pricing options
    Given I am logged in as "klreg@omniapcc.ams" booking a new trip
    # klreg is a traveller-only user: they are preselected as the traveller, with no "Add me" button
    And the traveler name "Annalise Burberry" should be visible in the travelers list
    When I click on the flight tab and check Allow nearby airports
    And I search for a round trip flight from "MST" to "PVG"
    And flight results should be available
    And I click to open first pricing options
    And I select the first option from pricing options
    And I select the first option from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
    And text "Flight To Shanghai" should be visible
    And text "Flight To Maastricht" should be visible
