# Test Name: 84952 Ratehawk - Hotel address displays the searched city in results, room level and cart
# Description:
# Status: Active
# Labels: Hotel,Ratehawk Regression,Full Purchase,address
# Owner: Bruna Santos
# Created: 2026-09-18

# ADO Test Case ID: 84952

@regression @provider:ratehawk
Feature: 84952 Ratehawk - Hotel address city is consistent from results to booking
  As a corporate traveler using Ratehawk
  I want the hotel address to show the searched city in results, room level and cart
  So that I can trust I am booking a property in the right location

  @priority:high
  Scenario: Hotel address contains the searched city through search, cart and booking
    Given I am logged in as "lidi@ratehawk.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Carlo Felice Boutique Hotel" for 1 night
    And I wait to see view rates text in results page
    Then the first hotel results should have "Turin" in the address
    When I select the first hotel result
    Then the hotel address in room level results should contain "Turin"
    When I add a refundable room to my cart
    # Opens the More Details drawer, asserts the address and closes the drawer again
    Then the hotel address in more details should contain "Turin"
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    And the hotel address in more details should contain "Turin"
    Then I successfully cancel the trip
