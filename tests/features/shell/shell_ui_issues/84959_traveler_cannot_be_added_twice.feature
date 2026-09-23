# Test Name: Traveller cannot be added twice to the same trip
# Description: A traveller already on the trip must not be addable a second time from the
#              add-traveller autocomplete, so the trip never ends up with the same person
#              as both the first and the second passenger.
# Status: Ready
# Labels: Regression,Shell,Travel Arranger,Travellers
# ADO: 84959
# Owner: Bruna Santos

@regression @shell @travel-arranger
Feature: 84959 Traveller cannot be added twice to the same trip

  As a booker
  I want the add-traveller autocomplete to refuse a traveller who is already on the trip
  So that the same person is never booked as two separate passengers

  @priority:medium
  Scenario: Adding the same traveller twice does not create a second passenger
    Given I am logged in as "victor@agreementcarsabre.com" booking a new trip
    And I add a traveler by name "Pedro Carneiro" from the search autocomplete
    And the traveler name "Pedro Carneiro" is added successfully
    When I add a traveler by name "Pedro Carneiro" from the search autocomplete
    Then I should not see "Pedro Carneiro" added as second passenger
