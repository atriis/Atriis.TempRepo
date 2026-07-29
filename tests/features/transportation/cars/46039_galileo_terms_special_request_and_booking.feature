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
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "AVIS"
    And I wait for add to trip text to be visible
    # TODO (Create or reuse): And I click in terms and conditions in results
    #TODO: Then terms and conditions are displayed - verify this by verify the word RATE is displayed and close dialog
    When I add the first car to cart
    And the booking status should be "Pending booking"
    When I add a special request text of 100 characters
    Then the special request should be truncated to 64 characters
    # TODO (Create or reuse): And I click in terms and conditions in cart
    #TODO: Then terms and conditions are displayed - verify this by verify the word RATE is displayed and close dialog
    When I proceed to checkout
    And I complete the booking
    # TODO (Create or reuse): And I click in terms and conditions in cart
    #TODO: Then terms and conditions are displayed - verify this by verify the word RATE is displayed and close dialog
    Then I successfully cancel the trip
