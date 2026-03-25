# Test Name: Hybrid for 59206: Amadeus (OBT) - Flights - Multi pax booking succeeds, contact info association per pax
# Description:
# Status: Active
# Labels: Amadeus,Flights,Full Purchase,Regression,multi pax,GDS,progress page,Cancel by process,Club,contact info,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-11T07:19:01Z
# Updated: 2026-01-26T03:34:41Z

@regression @flights @amadeus @multi-pax @contact-info @full-purchase @hybrid
Feature: 59206 Amadeus - Multi-pax booking with contact info per pax
  As a corporate traveler
  I want contact info to be associated per passenger in a multi-pax booking
  So that each traveler gets the correct contact details

  Scenario: Book flight for 3 guests and verify contact info in checkout
    Given I am logged in as "multipax" booking a new trip
    And I have added a random guest traveler
    # TODO: Add second and third random guest travelers
    # Testim: Add_second_traveler___random_guest() + Add_third_traveler___random_guest()
    # Existing step "I have added a random guest traveler" adds only one
    # Need the step to be called multiple times for multiple guests
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a one way flight from "PAR" to "FRA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    # TODO: Add contact info per passenger and finalize
    # Testim: Add_contact_info_and_Finalize() — fills contact details for each pax,
    # clicks finalize, verifies success
    # Need new steps for per-pax contact info
    And I complete the booking
    # TODO: Verify "Flight to" text in trip overview
    # Testim: waitForText(page, ".has-text-weight-semibold", /Flight to/)
