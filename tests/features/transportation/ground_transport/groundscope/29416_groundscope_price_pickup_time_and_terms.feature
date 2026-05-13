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
    Given I am logged in as "elisabeteferreira@groundscope.com" booking a new trip
    And I have added myself as the traveler
    When I search for ground transport from airport "lhr" to specific address "emirates"
    And I handle conflicting quotes if visible
    Then ground transport terms and conditions should be displayed in results
    When I extract the ground transport results price and VAT
    And I add the first result to trip
    Then the ground transport pickup time should stay the same across the system
    And the ground transport results price with VAT should equal the cart price
    And ground transport terms and conditions should be displayed in cart
    When I add ground transport contact information
    And I add a credit card as payment method
    And I fill credit card cvv if needed
    And I proceed to checkout
    And I complete the booking
    Then ground transport terms and conditions should be displayed after booking
    And I successfully cancel the trip
