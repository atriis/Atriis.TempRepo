# Test Name: 44941 [Merge] Benerail Moove - Journey details time match results page and pax does not go missing once adding quote to cart
# Description:
# Status: Active
# Labels: Rail,Keeps failing,Benerail Moove Regression,Bene seats,merge,results,Cart,Adding Passengers,Transportation,2026 plan 1,02
# Owner: Bruna Santos
# Created: 2024-04-18T09:24:08Z
# Updated: 2025-11-06T02:29:36Z
@transportation @rails @benerail @regression
Feature: 44941 Benerail - Journey details time matches results page and passenger not lost on add to cart
  As a corporate traveler
  I want the journey departure and arrival times shown in journey details to match the results page
  So that I can trust the time information and confirm my passenger remains in cart after adding

  Scenario: Journey details times match results page and passenger is visible in cart after adding
    Given I am logged in as "pmac@bene.ral" booking a new trip
    And I have added myself as the traveler
    When I search direct only option for a one way Benerail train from "bebmiToSchiphol"
    And I wait for select text to be visible
    And I extract the first result departure time
    And I extract the first result arrival time
    When I open journey details for the first Benerail result
    Then I should see "bruxelles-midi (be)" in journey details
    And I extract the departure and arrival times from the journey details panel
    Then the journey details times should match the results page times
    And I close the Benerail journey details panel
    When I add a Benerail one way to the trip
    And the booking status should be "Pending booking"
    Then the traveler "Pedro" is available in cart page
