# Test Name: 32693 Amadeus - In case of two separate tickets, autocomplete is displayed for hotels
# Description:
# Status: Active
# Labels: Flights,Amadeus,Regression,No Amadeus Hotel Book,never failed,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-29T02:22:19Z
# Updated: 2023-06-29T03:38:52Z

@regression @flights @amadeus @separate-tickets @hotel-autocomplete
Feature: 32693 Amadeus - Separate tickets trigger hotel autocomplete
  As a corporate traveler
  I want to see hotel autocomplete pre-filled with the flight destination
  So that I can quickly add a hotel when booking separate ticket flights

  Scenario: Two separate one-way flights trigger hotel autocomplete for destination
    Given I am logged in as "brunaoliveira" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "BUD" to "LON"
    And I add the first flight to cart
    # TODO: Click on the first product navigation icon (flight tab in trip bar)
    # Testim: page.click(".flicking-camera > :nth-child(1) .icon-text")
    # TODO: Click search button to re-run flight search
    # Testim: page.click(".search-btn")
    # TODO: Add second flight from results to create separate tickets
    # Testim: page.click(".flight-list > :nth-child(2) .is-hidden-mobile")
    # TODO: Click on the second product navigation icon (hotel tab)
    # Testim: page.click(".flicking-camera > :nth-child(2) .icon-text")
    # TODO: Verify hotel destination autocomplete shows "London,United Kingdom,(LON)"
    # Testim: waitForText(page, "[valuekey='value']", 'London,United Kingdom,(LON)')
    # TODO: Verify check-in and check-out date fields are visible
    # Testim: isVisible(page, "[placeholder='Check in']") and "[placeholder='Check out']"
    # Need new steps for product navigation, re-search, second flight addition,
    # and hotel autocomplete verification
