# Test Name: 46039 Galileo - Car - Check "Terms and Conditions" are displayed, only 64 characters are allowed in special request and successful booking
# Description:
# Status: Active
# Labels: Galileo,Cars,Regression,special request,Full Purchase,Terms and Conditions,progress page,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-10T11:01:07Z
# Updated: 2025-07-16T12:49:44Z
@regression @cars @provider:galileo
Feature: 46039 Galileo terms, special request length, and booking flow
  As a corporate traveler
  I want Galileo terms and special-request limits validated during booking
  So that the cart and checkout experience stays compliant and stable

  @priority:critical
  Scenario: Validate terms visibility, special request limit, and successful booking
    Given I am logged in as "beatrizpamplonacorp" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "AVIS"
    # TODO: Map Testim step Car___Results___Click__Terms_and_Conditions__and_check_if_it_is_displayed__AVIS_().
    When I add the first car to cart
    Then the booking status should be "Pending booking"
    # TODO: Map Testim step Only_64_characters_are_allowed_in_special_request().
    # TODO: Map Testim step Car___Cart___Click__Terms_and_Conditions__and_check_if_it_is_displayed__AVIS_().
    When I proceed to checkout
    And I complete the booking
    # TODO: Map Testim step Cart___Click__Terms_and_Conditions__and_check_if_it_is_displayed__AVIS_().
    Then I successfully cancel the trip
