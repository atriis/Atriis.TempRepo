# Test Name: 60539 Amtrak search form validations
# Description: validate all the search params
# Status: Active
# Labels: search,Regression,Amtrak Sabre,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-04-03T11:10:53Z
# Updated: 2025-12-23T03:42:20Z
@wip @transportation @rails @amtrak @regression
Feature: 60539 Amtrak - Search form validations
  As a corporate traveler
  I want to validate all search parameters in the Amtrak search form
  So that I can confirm search form fields and validations work correctly

  Scenario: Amtrak search form fields and passenger validations
    Given I am logged in as "bar@benerail.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Amtrak train from "nypToWas"
    # TODO: create step "And I validate the departure time selector in Amtrak search" in amtrak.steps.js
    # covers: open "From" time picker, select hour = 01, minute = 00 — Validating_TIME__from_()
    And I validate the departure time selector in Amtrak search
    # TODO: create step "And I validate the return time selector in Amtrak search" in amtrak.steps.js
    # covers: open "To" time picker, select hour = 02, minute = 00 — Validating_TIME__to_()
    And I validate the return time selector in Amtrak search
    # TODO: create step "When I add a second traveler through the Amtrak search form" in amtrak.steps.js
    # covers: click add traveler icon in search form, select from dropdown — Adding_second_traveler_through_search_form()
    When I add a second traveler through the Amtrak search form
    # TODO: create step "Then the promo code minimum length validation should be displayed" in amtrak.steps.js
    # covers: type '123' in promo code field, verify 'Promo Code must be 4 characters' error — __Promo_Code()
    Then the promo code minimum length validation should be displayed
    # TODO: create step "When I expand the traveler detail section in Amtrak search" in amtrak.steps.js
    # covers: click rows edit icon, click option — Adding_traveler_detail()
    When I expand the traveler detail section in Amtrak search
    And I have added a random guest traveler with name "Israel" "Israeli"
    # TODO: create step "And I enter a valid Amtrak promo code" in amtrak.steps.js
    # covers: type '1234' into the promo code field — Adding_valid_Promo_Code()
    And I enter a valid Amtrak promo code
    # TODO: create step "Then the Amtrak search results should be displayed" in amtrak.steps.js
    # covers: click search button, proceed through reference fields, wait for results — Search_results_are_displayed()
    Then the Amtrak search results should be displayed
