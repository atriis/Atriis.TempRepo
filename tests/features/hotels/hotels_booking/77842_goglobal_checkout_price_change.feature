# ADO Test Case ID: 77842
@ado:77842
@regression @provider:goglobal
Feature: 77842 GoGlobal - Checkout price change
  As a corporate traveler booking a GoGlobal hotel
  I want the checkout price-change notification to clearly show the old and new prices
  So that I can review the increase and complete the booking at an accurate, confirmed price

  @priority:critical
  Scenario: GoGlobal hotel price increase at checkout is shown and the booking completes at the new price
    Given I am logged in as "gg@pricechange.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Hotel Artemis Amsterdam" for 1 night close dates
    And I filter hotel results by hotel name "Hotel Artemis Amsterdam" or "Nh Amsterdam Caransa"
    And I select the first hotel result
    And I filter room results by refundable
    And I add room called "FAKE -STANDARD- Valuation Price Increase" to cart
    And I extract the price at index 0 from "cart"
    And I extract the hotel name from cart
    And I extract the dates from cart
    When I proceed to checkout expecting a price change notification
    Then the checkout price change notification should be valid and show an increase from the extracted cart price
    When I extract the new price from the checkout price change notification
    And I proceed with the price change
    Then the checkout total should match the extracted new price
    When I complete the booking
    Then the price at index 0 from cart should match the extracted new price
    And the booking status should be "Confirmed"
    Then I successfully cancel the trip
