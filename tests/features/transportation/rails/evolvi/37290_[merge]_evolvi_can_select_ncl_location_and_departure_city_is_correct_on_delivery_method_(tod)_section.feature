# Test Name: 37290 [Merge] Evolvi - Can select "NCL" location and departure city is correct on Delivery Method (TOD) section
# Description:
# Status: Active
# Labels: Regression,merge,Rail,Evolvi,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-10-23T03:22:12Z
# Updated: 2025-09-14T08:45:49Z
@wip @transportation @rails @evolvi @regression
Feature: 37290 Evolvi - Select NCL location and validate departure city in TOD section
  As a corporate traveler
  I want to search Evolvi with NCL location
  So that departure city appears correctly in the delivery method section

  Scenario: NCL search and TOD departure city validation
    Given I am logged in as "thiagosantos" booking a new trip
    And I have added myself as the traveler
    # TODO: create step "When I search Evolvi with NCL location" in evolvi_search.steps.js
    # covers: Evolvi___Can_select__NCL__location_and_search()
    When I search Evolvi with NCL location
    # TODO: create step "When I close mandatory notifications if displayed" in evolvi_results.steps.js
    When I close mandatory notifications if displayed
    # TODO: create step "When I select a random available Evolvi fare" in evolvi_results.steps.js
    # covers: Evolvi___select_random_available_fare_1()
    When I select a random available Evolvi fare
    When I add an Evolvi one way to the trip
    When I handle conflicting quotes if visible
    # TODO: create step "Then the cart status should be Pending booking" in evolvi_results.steps.js
    # covers: Pending_booking___wait_for_element_text()
    Then the cart status should be Pending booking
    # TODO: create step "Then the departure city should be correct in the Evolvi TOD section" in evolvi_results.steps.js
    # covers: Departure_city_is_correct_on_Delivery_Method__TOD__section()
    Then the departure city should be correct in the Evolvi TOD section
