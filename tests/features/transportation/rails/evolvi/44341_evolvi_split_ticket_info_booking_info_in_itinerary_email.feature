# Test Name: 44341 - Evolvi Split Ticket - Info, booking, info in itinerary email
# Description:
# Status: Active
# Labels: Club,Email,Regression,Rail,Daily Transportation,Full Purchase,Evolvi,Transportation,2026 plan 1
# Owner: Noam Miller
# Created: 2024-06-02T09:24:29Z
# Updated: 2026-01-30T02:27:46Z
@wip @transportation @rails @evolvi @regression
Feature: 44341 Evolvi - Split ticket info before and after booking and in itinerary email
  As a corporate traveler
  I want to use split ticket options in Evolvi
  So that split ticket details remain consistent in cart, booking, and itinerary email

  Scenario: Validate split ticket information across search, cart, and itinerary email
    Given I am logged in as "corp_evolvi32" booking a new trip
    And I have added myself as the traveler
    # TODO: create step "When I select UK Rail in the search form" in evolvi_search.steps.js
    # covers: Select_UK_Rail()
    When I select UK Rail in the search form
    # TODO: create step "When I validate and configure split ticket options in Evolvi search" in evolvi_search.steps.js
    # covers: Split_Ticket_options_in_search_form()
    When I validate and configure split ticket options in Evolvi search
    # TODO: create step "When I perform the Evolvi split ticket search" in evolvi_search.steps.js
    # covers: Search()
    When I perform the Evolvi split ticket search
    # TODO: create step "When I select a Split Ticket result" in evolvi_results.steps.js
    # covers: Result_page__select_Split_Ticket()
    When I select a Split Ticket result
    # TODO: create step "Then split ticket information should be visible in cart before checkout" in evolvi_results.steps.js
    # covers: Split_Ticket_info_in_cart__before_checkout()
    Then split ticket information should be visible in cart before checkout
    # TODO: create step "When I fill mandatory Evolvi fields in cart" in evolvi_results.steps.js
    # covers: Fill_mandatory_fields_in_cart()
    When I fill mandatory Evolvi fields in cart
    # TODO: create step "Then split ticket information should be visible after checkout and in itinerary email" in evolvi_results.steps.js
    # covers: Split_Ticket_info_in_cart__after_checkout_and_itinerary_email()
    Then split ticket information should be visible after checkout and in itinerary email
    # TODO: create step "Then itinerary email split ticket information should match the trip" in evolvi_results.steps.js
    # covers: Info_in_itinerary_email_matches_info_in_trip()
    Then itinerary email split ticket information should match the trip
