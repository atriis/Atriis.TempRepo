# Test Name: 46712 Fusion - Bag price is being added to the price
# Status: Active
# Labels: Regression,Flights,baggage,Fusion,price,FailedFusion,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-31T08:14:53Z
# Updated: 2025-07-16T05:09:59Z

@regression @flights @fusion @baggage @price @priority:high
Feature: 46712 Fusion EasyJet - Bag price is correctly added to the total price
  As a corporate traveler adding baggage to a Fusion EasyJet booking
  I want the bag price to be added to the total price in price breakdown and cart
  So that the cart total reflects the baggage cost

  Scenario: Bag price added correctly to Fusion EasyJet round trip booking
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LGW" to "LIS"
    And I filter results by carrier "U2"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    # TODO: implement 'I add baggage to the cart' — see Add_baggage_to_cart() in Testim source (test 46712)
    # TODO: implement 'I extract the price from price breakdown' — see Extract_value_from_price_breakdown() in Testim source (test 46712)
    Then the booking status should be "Pending booking"
    # TODO: implement 'I extract the price from cart' — see Extract_value_from_cart() in Testim source (test 46712)
    # TODO: implement 'the price breakdown price should equal the cart price' — see Verify_two_strings_are_equal_1(priceBreakdown, cart) in Testim source (test 46712)
    Then I successfully cancel the trip
