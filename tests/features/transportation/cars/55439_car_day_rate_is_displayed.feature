# Test Name: 55439 Car - Display day rate
# Description:
# Status: Active
# Labels: Cars,Gray Dawes,price,Regression,Transportation,2026 plan 1
# Owner: Noam Miller
# Created: 2024-12-09T05:24:09Z
# Updated: 2025-09-29T02:40:40Z
@regression @cars
Feature: 55439 Car day rate is displayed consistently
  As a corporate traveler
  I want to see day-rate pricing consistently across the car flow
  So that pricing details remain reliable from results through cart details

  @priority:high
  Scenario: Validate day rate across results, cart, new search, and more details
    Given I am logged in as "carCorp@gdg.com" booking a new trip
    And I have added myself as the traveler
    # TODO: Map Testim step Search_car() to the exact search parameters used by this test.
    # TODO: Map Testim step Validate_daily_rate_in_results().
    # TODO: Map Testim step Add_car_to_cart().
    # TODO: Map Testim step Validate_daily_rate_in_cart().
    # TODO: Map Testim step Cancel_quote_from_cart_before_checkout().
    # TODO: Map Testim step New_search_from_cart().
    # TODO: Map Testim step Validate_daily_rate_and_add_to_cart().
    # TODO: Map Testim step Validate_number_of_days_and_rate_in_more_details().
    Then I successfully cancel the trip
