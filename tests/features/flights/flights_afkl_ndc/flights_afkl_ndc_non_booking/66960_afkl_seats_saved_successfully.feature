# Test Name: 66960 AFKL - Seats are saved successfully
# Status: Active
# Labels: Regression,Flights,AFKL,NDC,Seating,Extras
# Owner: Bruna Santos

@regression @flights @afkl @ndc @seating @extras
Feature: 66960 AFKL - Seats are saved successfully on an AFKL one way flight
  As a corporate traveler
  I want to add a seat to my AFKL booking
  So that the seat is saved and the booking remains in pending state

  Scenario: Select and save a seat on an AFKL one way flight
    Given I am logged in as "bsafkl@bsafkl.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "AMS" to "CDG"
    And flight results should be available
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
    And I select the first available flight seat
    And I save and close seat map drawer
    Then I should see a success notification
