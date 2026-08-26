# Test Name: 29416 [Merge] GroundScope - Price and pick up time do not change, "Terms and Conditions" are displayed in results, cart and after checkout and booking it
# Description:
# Status: Active
# Labels: Groundscope Regression,Full Purchase,Terms and Conditions,merge,time,progress page,Pre Prod,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-05-25T04:21:26Z
# Updated: 2025-09-29T04:00:26Z

@regression @transportation @ground_transport @provider:groundscope @full_purchase @merge
Feature: 29416 GroundScope - Price, pickup time and terms remain consistent through booking

  As a corporate traveler
  I want GroundScope price, pickup time, and terms to stay consistent across the flow
  So that I can book with confidence that the offer does not change unexpectedly

  Scenario: GroundScope price, pickup time, and terms remain stable from results to booking
    Given I am logged in as "elisabete@groundscope.com" booking a new trip
    And I have added myself as the traveler
    When I search for ground transport from airport "lhr" to specific address "emirates"
    And I wait for add to trip text to be visible
    Then the ground transport terms and conditions should include "Additional service partner charges"
    When I extract the ground transport results price and VAT
    And I add the first result to trip
    And the booking status should be "Pending booking"
    Then the ground transport pickup time should stay the same in cart and more details
    And the ground transport results price with VAT should equal the cart price
    Then the cart terms and conditions should include "Additional service partner charges"
    When I add ground transport contact information
    And I click add payment method button
    And I select card 1 and save
    And the booking status should be "Pending booking"
    And I fill credit card cvv if needed
    And I proceed to checkout
    And I complete the booking
    Then the cart terms and conditions should include "Additional service partner charges"
    And I successfully cancel the trip
