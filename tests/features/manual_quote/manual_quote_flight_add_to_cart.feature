@regression
Feature: Manual Quote - Add Flight Manual Quote to Cart
  As a corporate traveler
  I want to search and add manual flight quotes to my cart
  So that I can review flight options with custom pricing

  @priority:critical
  Scenario: Add flight manual quote to cart
    Given I am logged in and ready to book a new trip
    And I have added myself as the traveler
    When I search and add a flight manual quote
    Then the booking status should be "On Hold"
    When I cancel the trip
    Then the trip should be successfully cancelled