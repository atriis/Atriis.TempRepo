# Test Name: 55667 can't search from cart and search page in case of  locked trip
# Description:
# Status: Active
# Labels: search,Rail,Cart,locked trip,Regression,Pre Prod,Daily Shell,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-12-19T10:30:28Z
# Updated: 2025-03-03T05:51:25Z
#
# TEST DATA: user pini@gov.nl; trip 3768590 is a Confirmed rail booking in the past,
# i.e. a locked / completed trip. The scenario is read-only — it books nothing.

@regression @shell @rails @cart @search @locked-trip
Feature: 55667 - Can't search from cart and search page in case of a locked trip
  As a corporate travel booker
  I want a completed trip to block every way of searching for or adding new products
  So that I start a new trip instead of changing a trip that is already closed

  Scenario: A locked trip offers no way to search for or add new products
    Given I am logged in as "pini@gov.nl"
    When I navigate to trip 3768590
    Then I should see a quote with status "Confirmed"
    And the add product carousel should not be displayed in the trip cart
    And the locked trip message "Adding new products or making changes is no longer possible for completed trips. To add products, please Start a New Trip" should be displayed in the trip cart
    When I navigate to the search page of trip 3768590
    Then the trip search form should display the "Round trip" trip type option
    And the search button should not be visible
