@transportation @cars @regression
Feature: Sunny Cars - Expired quote is not displayed in checkout summary

  Scenario: Verify expired quote is not shown in checkout summary
    Given I am logged in as "kaylesun"
    And I navigate to an expired trip
    When I search for a car from the cart
    And I add the first available car from results to cart
    And I wait for pending booking
    And I add a credit card to the booking
    And I fill free text justification in cart
    And I accept terms and conditions and proceed to checkout
    Then only one quote price is displayed in checkout
    When I click the cart
    And I cancel the pending booking quote
    Then the expired quote is no longer displayed
