# Test Name: 30463 [Merge] Amadeus - Agreement text is displayed in the tooltip, book car and validate that the Terms & Conditions are displayed
# Description:
# Status: Active
# Labels: Regression,CR7,Cars,No Amadeus Hotel Book,Full Purchase,Amadeus,merge,Agreement,Terms and Conditions,progress page,Pre Prod,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-12-29T04:21:39Z
# Updated: 2025-07-30T03:23:50Z
@regression @cars @provider:amadeus
Feature: 30463 Amadeus agreement tooltip and terms validation
  As a corporate traveler
  I want to validate agreement and terms visibility during a car booking
  So that Amadeus car content is shown consistently across the flow

  @priority:critical
  Scenario: Validate agreement tooltip and terms across results, cart, and checkout
    Given I am logged in as "ruimendes@amadeus.com" booking a new trip
    And I have added a random guest traveler
    When I select rental agency "Enterprise"
    And I search for a car at "LHR"
    # TODO: Map Testim step Agreement_tex_is_displayed_in_the_tooltip() to a reusable results assertion.
    # TODO: Map Testim step Validate_terms_and_conditions() to a reusable results terms validation step.
    When I add the first car to cart
    Then the booking status should be "Pending booking"
    # TODO: Map Testim step Validate_terms_and_conditions_1() to a reusable cart terms validation step.
    When I proceed to checkout
    And I complete the booking
    # TODO: Map Testim step Validate_terms_and_conditions_2() to a reusable checkout terms validation step.
    Then I successfully cancel the trip
