# Test Name: 55700 - Galileo NDC - AA, Search by schedule, booked as separate tickets
# Status: Active
# Labels: Gray Dawes,Galileo NDC,Flights,Fare Rules,Regression,2026 plan 1
# Owner: Noam Miller
# Created: 2024-12-22T08:12:19Z
# Updated: 2025-11-26T06:53:20Z

@regression @galileo @ndc @flights @fare_rules @separated_tickets
Feature: 55700 Galileo NDC - AA search by schedule booked as separate tickets

  As a corporate traveler
  I want to search AA flights by schedule and book as separate tickets
  So that fare rules and branded fares are correctly displayed for NDC content

  #It keeps failing in Testim, need to talk to someone from the flight domain to understand what's happening
  Scenario: AA NDC by schedule search with fare rules, branded fares and separate tickets
    Given I am logged in as "corpNDC@gdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "LAX" to "DFW"
    And I filter results by carrier "AA"
    # TODO: Fare_rules__Brand_info_in_results — complex multi-step verification:
    # 1. Verify "NDC direct rate" text visible
    # 2. Open flight details → verify "Total price" → open branded fares → verify brand name + services
    # 3. Close branded fares → close flight details
    # 4. Open fare rules → verify "Carrier: American Airlines" + Change/Cancel rules → close
    And I click to open flight details
    And I open branded fares from flight details
    And I close branded fares drawer
    And I close flight details window
    And I click to open fare rules
    Then I should see the fare rules note about strictest terms
    When I close fare rules window
    # TODO: Select_flights_from_results__by_schedule_search__separated_tickets:
    # 1. Select first outbound → wait for "Change flight"
    # 2. Filter AA again → select first inbound
    # 3. Verify "Your selection" + "Separated Tickets" indicator
    # 4. Click Select on first pricing option
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I filter results by carrier "AA"
    And I select one flight segment by schedule
    And I select the first option from pricing options
    And I handle conflicting quotes if visible
    # TODO: Validate_separate_tickets_in_cart_and_checkout:
    # 1. Verify 2 quote titles in cart
    # 2. Add payment to each quote
    # 3. Accept T&C for both → proceed → book → verify success → go to trip
    # 4. Verify 2 quote titles + PNR codes in trip overview
    Then I successfully cancel the trip
