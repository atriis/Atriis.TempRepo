# Test Name: 33896 Benerail - Can save date of birth in case of guest/pax without DOB
# Description:
# Status: Active
# Labels: guest,Rail,Cart,Regression,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-22T01:23:38Z
# Updated: 2026-02-03T10:49:44Z
@wip @transportation @rails @benerail @regression
Feature: 33896 Benerail - Can save date of birth for guest passenger without DOB
  As a corporate traveler booking for a guest without a date of birth
  I want to save the birth date in the Benerail cart extras
  So that the booking can proceed with the required passenger information

  Scenario: Benerail cart allows saving date of birth for guest without pre-configured DOB
    Given I am logged in as "beny_nl" booking a new trip
    # TODO: create step "And I have added a guest passenger without date of birth named Israel Israeli" in search.steps.js
    # covers: add_guest_Israel_Israeli_without_date_of_birth() — adds guest with name but no DOB
    And I have added a guest passenger without date of birth named "Israel" "Israeli"
    # TODO: create step "And I set the age category to youth for the traveler" in search.steps.js
    # covers: choose_age_youth() — selects youth age category in the traveler form
    And I set the age category to youth for the traveler
    When I search for a one way Benerail train from "bebmiToNlabk"
    # TODO: create step "And I fill in the reference and dynamic fields for the Benerail search" in benerail_search.steps.js
    # covers: fill_reference_and_dynamic_fields()
    And I fill in the reference and dynamic fields for the Benerail search
    When I add a Benerail round trip to the trip
    # TODO: create step "Then the birth date section should be visible and required in the Benerail cart" in benerail_results.steps.js
    # covers: waitForText(".eu-rail-date-of-birth .card-title", '* Birth Date')
    Then the birth date section should be visible and required in the Benerail cart
    # TODO: create step "When I save the birth date in the Benerail cart" in benerail_results.steps.js
    # covers: save_birth_date_in_cart()
    When I save the birth date in the Benerail cart
    # TODO: create step "Then the birth date should be saved successfully in the Benerail cart" in benerail_results.steps.js
    # covers: validate_saved() — verifies birth date is persisted
    Then the birth date should be saved successfully in the Benerail cart
